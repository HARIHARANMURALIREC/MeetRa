import { useEffect, useMemo, useState } from 'react'
import { Hand } from 'lucide-react'
import { useParticipants } from '@livekit/components-react'
import type { Participant as LiveKitParticipant } from 'livekit-client'
import { supabase } from '../../lib/supabase'
import { callRoomAdmin } from '../../lib/roomAdmin'
import { useMeetingStore } from '../../store/useMeetingStore'
import { PanelCloseButton } from './PanelCloseButton'
import { RoomPanelPortal } from './RoomPanelPortal'
import type { Participant } from '../../types'

interface ParticipantsPanelProps {
  roomId: string
  isHost?: boolean
  raisedHands?: Record<string, boolean>
}

type PendingAction = 'mute' | 'remove'

function audioTrackSids(participant: LiveKitParticipant) {
  return [...participant.audioTrackPublications.values()]
    .map((pub) => pub.trackSid)
    .filter((sid): sid is string => Boolean(sid))
}

export function ParticipantsPanel({ roomId, isHost, raisedHands = {} }: ParticipantsPanelProps) {
  const participantsOpen = useMeetingStore((s) => s.participantsOpen)
  const setParticipantsOpen = useMeetingStore((s) => s.setParticipantsOpen)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [pending, setPending] = useState<Record<string, PendingAction | undefined>>({})
  const [actionError, setActionError] = useState<string | null>(null)
  const livekitParticipants = useParticipants()

  const livekitByIdentity = useMemo(
    () => new Map(livekitParticipants.map((p) => [p.identity, p])),
    [livekitParticipants],
  )

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .is('left_at', null)
        .order('joined_at', { ascending: true })
      if (data) setParticipants(data)
    }

    load()

    const channel = supabase
      .channel(`participants-list-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  async function handleMute(userId: string) {
    if (!isHost || !userId || pending[userId]) return
    setActionError(null)
    setPending((current) => ({ ...current, [userId]: 'mute' }))
    try {
      const lkParticipant = livekitByIdentity.get(userId)
      await callRoomAdmin({
        action: 'mute',
        roomId,
        participantIdentity: userId,
        trackSids: lkParticipant ? audioTrackSids(lkParticipant) : undefined,
      })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mute participant')
    } finally {
      setPending((current) => {
        const next = { ...current }
        delete next[userId]
        return next
      })
    }
  }

  async function handleRemove(userId: string) {
    if (!isHost || !userId || pending[userId]) return
    setActionError(null)
    setPending((current) => ({ ...current, [userId]: 'remove' }))
    setParticipants((current) => current.filter((p) => p.user_id !== userId))
    try {
      await callRoomAdmin({ action: 'remove', roomId, participantIdentity: userId })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove participant')
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .is('left_at', null)
        .order('joined_at', { ascending: true })
      if (data) setParticipants(data)
    } finally {
      setPending((current) => {
        const next = { ...current }
        delete next[userId]
        return next
      })
    }
  }

  if (!participantsOpen) return null

  const inCallIds = new Set(livekitParticipants.map((p) => p.identity))

  return (
    <RoomPanelPortal>
      <div className="room-shell fixed inset-x-0 bottom-[7rem] z-[100] flex h-[min(50vh,24rem)] flex-col rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:inset-x-auto sm:bottom-0 sm:right-0 sm:top-0 sm:h-dvh sm:max-h-none sm:w-72 sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="font-semibold text-[var(--text)]">People ({participants.length})</h3>
          <PanelCloseButton onClick={() => setParticipantsOpen(false)} label="Close people panel" />
        </div>
        {actionError && (
          <p className="shrink-0 border-b border-[var(--border)] px-4 py-2 text-xs text-[var(--meetra-danger)]">
            {actionError}
          </p>
        )}
        <ul className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {participants.map((p) => {
          const inCall = p.user_id ? inCallIds.has(p.user_id) : false
          const raised = p.user_id ? raisedHands[p.user_id] : false
          const userPending = p.user_id ? pending[p.user_id] : undefined
          return (
            <li key={p.id} className="mb-2 flex items-center justify-between rounded-lg bg-[var(--bg)] px-3 py-2">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 truncate text-sm text-[var(--text)]">
                  {p.display_name ?? 'Guest'}
                  {raised && <Hand className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-label="Raised hand" />}
                </span>
                <p className="text-xs text-[var(--muted)]">
                  {userPending === 'remove'
                    ? 'Removing…'
                    : userPending === 'mute'
                      ? 'Muting…'
                      : inCall
                        ? 'In call'
                        : p.approved
                          ? 'Approved'
                          : 'Waiting'}
                </p>
              </div>
              {isHost && p.user_id && inCall && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleMute(p.user_id!)}
                    disabled={Boolean(userPending)}
                    className="text-[10px] text-[var(--accent)] disabled:opacity-50"
                  >
                    {userPending === 'mute' ? 'Muting…' : 'Mute'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(p.user_id!)}
                    disabled={Boolean(userPending)}
                    className="text-[10px] text-[var(--meetra-danger)] disabled:opacity-50"
                  >
                    {userPending === 'remove' ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              )}
            </li>
          )
        })}
        </ul>
      </div>
    </RoomPanelPortal>
  )
}
