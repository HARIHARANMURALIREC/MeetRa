import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useMeetingStore } from '../store/useMeetingStore'
import type { Room, RoomNote } from '../types'

interface HistoryRow {
  room: Room
  role: 'Host' | 'Participant'
  participantCount: number
  joinedAt: string
  leftAt: string | null
  notePreview?: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(joined: string, left: string | null) {
  const start = new Date(joined).getTime()
  const end = left ? new Date(left).getTime() : Date.now()
  const mins = Math.max(1, Math.round((end - start) / 60000))
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  return `${h}h ${mins % 60}m`
}

export function History() {
  const user = useMeetingStore((s) => s.user)
  const activeWorkspace = useMeetingStore((s) => s.activeWorkspace)
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)

      let hostQuery = supabase
        .from('rooms')
        .select('*')
        .eq('host_id', user!.id)
        .order('created_at', { ascending: false })
      if (activeWorkspace) hostQuery = hostQuery.eq('workspace_id', activeWorkspace.id)

      const { data: hosted } = await hostQuery

      const { data: parts } = await supabase
        .from('participants')
        .select('room_id, joined_at, left_at, approved')
        .eq('user_id', user!.id)
        .eq('approved', true)
        .order('joined_at', { ascending: false })

      const attendedIds = [...new Set((parts ?? []).map((p) => p.room_id))]
      const hostedIds = new Set((hosted ?? []).map((r) => r.id))
      const guestIds = attendedIds.filter((id) => !hostedIds.has(id))

      let guestRooms: Room[] = []
      if (guestIds.length > 0) {
        const { data } = await supabase.from('rooms').select('*').in('id', guestIds)
        guestRooms = data ?? []
      }

      const allRooms = [...(hosted ?? []), ...guestRooms]

      const counts = await Promise.all(
        allRooms.map(async (r) => {
          const { count } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', r.id)
            .eq('approved', true)
          return [r.id, count ?? 0] as const
        }),
      )
      const countMap = new Map(counts)

      const partByRoom = new Map((parts ?? []).map((p) => [p.room_id, p]))

      const noteRows = await Promise.all(
        allRooms.map(async (r) => {
          const { data } = await supabase
            .from('room_notes')
            .select('body')
            .eq('room_id', r.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          return [r.id, (data as RoomNote | null)?.body ?? null] as const
        }),
      )
      const noteMap = new Map(noteRows)

      const history: HistoryRow[] = allRooms
        .map((room) => {
          const part = partByRoom.get(room.id)
          return {
            room,
            role: (room.host_id === user!.id ? 'Host' : 'Participant') as 'Host' | 'Participant',
            participantCount: countMap.get(room.id) ?? 0,
            joinedAt: part?.joined_at ?? room.created_at,
            leftAt: part?.left_at ?? null,
            notePreview: noteMap.get(room.id),
          }
        })
        .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())

      setRows(history)
      setLoading(false)
    }

    void load()
  }, [user, activeWorkspace])

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl text-[var(--paper-100)] sm:text-4xl">History</h1>
      <p className="mt-2 text-sm text-[var(--paper-400)]">Rooms you&apos;ve hosted or joined.</p>

      {loading && (
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)]"
            />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 text-center"
        >
          <h2 className="font-display text-2xl text-[var(--paper-100)]">No meetings yet</h2>
          <p className="mt-2 text-sm text-[var(--paper-400)]">
            Start one from the dashboard — history will land here.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-md bg-[var(--signal)] px-5 py-2.5 text-sm font-semibold text-[var(--on-signal)]"
          >
            Go to Dashboard
          </Link>
        </motion.div>
      )}

      {!loading && rows.length > 0 && (
        <ul className="mt-8 divide-y divide-[var(--ink-700)] border-y border-[var(--ink-700)]">
          {rows.map((row, i) => (
            <motion.li
              key={`${row.room.id}-${row.joinedAt}`}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : i * 0.06, duration: 0.35 }}
              className="flex flex-col gap-3 py-5 transition-colors hover:bg-[var(--ink-900)]/60 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg text-[var(--paper-100)]">
                    {row.room.title || row.room.room_code}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      row.role === 'Host'
                        ? 'bg-[var(--signal-dim)] text-[var(--signal)]'
                        : 'bg-[var(--ink-700)] text-[var(--paper-400)]'
                    }`}
                  >
                    {row.role}
                  </span>
                </div>
                <p className="font-mono mt-1 text-xs text-[var(--paper-400)]">
                  {formatDate(row.joinedAt)} · {formatDuration(row.joinedAt, row.leftAt)} ·{' '}
                  {row.participantCount} participant{row.participantCount === 1 ? '' : 's'}
                </p>
                <p className="font-mono mt-0.5 text-[11px] text-[var(--paper-400)]/70">
                  {row.room.room_code}
                </p>
              </div>
              <Link
                to={`/history/${row.room.id}`}
                className="text-xs text-[var(--signal)] hover:underline"
              >
                {row.notePreview ? row.notePreview.slice(0, 40) + (row.notePreview.length > 40 ? '…' : '') : 'View details'}
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}
