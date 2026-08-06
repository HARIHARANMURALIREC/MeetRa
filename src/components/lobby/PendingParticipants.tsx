import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Participant } from '../../types'

interface PendingParticipantsProps {
  roomId: string
}

export function PendingParticipants({ roomId }: PendingParticipantsProps) {
  const [pending, setPending] = useState<Participant[]>([])

  useEffect(() => {
    async function loadPending() {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('approved', false)
        .is('left_at', null)
      if (data) setPending(data)
    }

    loadPending()

    const channel = supabase
      .channel(`pending-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => loadPending(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  async function handleApprove(participantId: string) {
    await supabase.from('participants').update({ approved: true }).eq('id', participantId)
  }

  async function handleDeny(participantId: string) {
    await supabase
      .from('participants')
      .update({ left_at: new Date().toISOString() })
      .eq('id', participantId)
  }

  if (pending.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-50 w-72 rounded-xl border border-[var(--meetra-border)] bg-[var(--meetra-surface)] p-4 shadow-xl">
      <h3 className="mb-3 font-semibold">Waiting to join ({pending.length})</h3>
      <ul className="space-y-2">
        {pending.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-lg bg-[var(--meetra-bg)] px-3 py-2"
          >
            <span className="truncate text-sm">{p.display_name ?? 'Guest'}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleApprove(p.id)}
                className="rounded px-2 py-1 text-xs font-medium text-[var(--meetra-success)] hover:bg-[var(--meetra-border)]"
              >
                Admit
              </button>
              <button
                type="button"
                onClick={() => handleDeny(p.id)}
                className="rounded px-2 py-1 text-xs font-medium text-[var(--meetra-danger)] hover:bg-[var(--meetra-border)]"
              >
                Deny
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
