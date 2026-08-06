import { supabase } from './supabase'
import { generateRoomCode, normalizeRoomCode } from './roomCode'
import type { Participant, Room } from '../types'

export async function findActiveRoom(code: string) {
  const normalized = normalizeRoomCode(code)
  if (!normalized) return { room: null as Room | null, error: 'Enter a meeting code' }

  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_code', normalized)
    .eq('is_active', true)
    .single()

  if (error || !room) {
    return { room: null, error: 'Meeting not found. Check the code and try again.' }
  }

  return { room: room as Room, error: null }
}

export function canJoinRoom(room: Room, _userId: string, isHost: boolean) {
  if (isHost) return { ok: true as const }
  if (room.scheduled_at && new Date(room.scheduled_at) > new Date()) {
    return { ok: false as const, error: `Meeting starts ${new Date(room.scheduled_at).toLocaleString()}` }
  }
  return { ok: true as const }
}

export function validatePasscode(room: Room, passcode?: string) {
  if (!room.passcode) return { ok: true as const }
  if (passcode?.trim() === room.passcode) return { ok: true as const }
  return { ok: false as const, error: 'Incorrect passcode' }
}

export async function joinRoomAsParticipant(
  room: Room,
  userId: string,
  displayName: string,
  isHost: boolean,
) {
  const waitingRoom = room.waiting_room_enabled !== false
  const { data: existing } = await supabase
    .from('participants')
    .select('*')
    .eq('room_id', room.id)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle()

  if (existing) return { participant: existing, error: null }

  const { error: insertError } = await supabase.from('participants').insert({
    room_id: room.id,
    user_id: userId,
    display_name: displayName,
    approved: isHost || !waitingRoom,
  })

  if (insertError) return { participant: null, error: insertError.message }

  const { data, error: selectError } = await supabase
    .from('participants')
    .select('*')
    .eq('room_id', room.id)
    .eq('user_id', userId)
    .is('left_at', null)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (selectError || !data) {
    return { participant: null, error: selectError?.message ?? 'Joined but could not load participant record' }
  }

  return { participant: data as Participant, error: null }
}

export async function createRoom(
  userId: string,
  displayName: string,
  opts?: {
    title?: string
    scheduledAt?: string
    isPersistent?: boolean
    passcode?: string
    waitingRoomEnabled?: boolean
    workspaceId?: string | null
  },
) {
  const roomCode = generateRoomCode()

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      room_code: roomCode,
      host_id: userId,
      title: opts?.title ?? `${displayName}'s meeting`,
      scheduled_at: opts?.scheduledAt ?? null,
      is_persistent: opts?.isPersistent ?? false,
      passcode: opts?.passcode || null,
      waiting_room_enabled: opts?.waitingRoomEnabled ?? true,
      workspace_id: opts?.workspaceId ?? null,
    })
    .select()
    .single()

  if (roomError || !room) {
    return { room: null, error: roomError?.message ?? 'Failed to create meeting' }
  }

  const { error: pError } = await supabase.from('participants').insert({
    room_id: room.id,
    user_id: userId,
    display_name: displayName,
    approved: true,
  })

  if (pError) return { room: null, error: pError.message }
  return { room: room as Room, error: null }
}
