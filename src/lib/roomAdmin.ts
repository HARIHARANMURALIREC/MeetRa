import { supabase } from './supabase'

export type RoomAdminAction = 'mute' | 'remove' | 'end'

interface RoomAdminPayload {
  action: RoomAdminAction
  roomId: string
  participantIdentity?: string
  /** When provided, skips a LiveKit participant lookup on mute. */
  trackSids?: string[]
}

export async function callRoomAdmin(payload: RoomAdminPayload) {
  const { data, error } = await supabase.functions.invoke('room-admin', {
    body: payload,
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}
