import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { normalizeRoomCode } from '../lib/roomCode'
import {
  canJoinRoom,
  createRoom,
  findActiveRoom,
  joinRoomAsParticipant,
  validatePasscode,
} from '../lib/joinRoom'
import { clearJoinIntent, getJoinIntent, readJoinParam } from '../lib/joinIntent'
import { useMeetingStore } from '../store/useMeetingStore'
import { SignalPulse } from '../components/layout/SignalPulse'
import { useCountUp } from '../hooks/useCountUp'
import type { Room } from '../types'

export function DashboardHome() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useMeetingStore((s) => s.user)
  const displayName = useMeetingStore((s) => s.displayName)
  const activeWorkspace = useMeetingStore((s) => s.activeWorkspace)
  const setDisplayName = useMeetingStore((s) => s.setDisplayName)
  const [joinCode, setJoinCode] = useState('')
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hosted, setHosted] = useState(0)
  const [joined, setJoined] = useState(0)
  const [persistentRooms, setPersistentRooms] = useState<Room[]>([])
  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [roomPasscode, setRoomPasscode] = useState('')
  const [waitingRoom, setWaitingRoom] = useState(true)
  const joinRef = useRef<HTMLInputElement>(null)
  const reduce = useReducedMotion()
  const autoJoinAttempted = useRef(false)

  const hostedDisplay = useCountUp(hosted)
  const joinedDisplay = useCountUp(joined)

  useEffect(() => {
    const fromUrl = readJoinParam(searchParams)
    const fromStorage = getJoinIntent()
    const code = fromUrl ?? fromStorage
    if (code) {
      setJoinCode(code)
      if (fromStorage) clearJoinIntent()
    }
  }, [searchParams])

  useEffect(() => {
    if (!user || autoJoinAttempted.current) return
    const code = readJoinParam(searchParams) ?? getJoinIntent()
    if (code && joinCode) {
      autoJoinAttempted.current = true
      void performJoin(code)
    }
  }, [user, joinCode, searchParams])

  useEffect(() => {
    if (!user) return
    if (!displayName && user.displayName) setDisplayName(user.displayName)

    async function loadStats() {
      let hostQuery = supabase
        .from('rooms')
        .select('*', { count: 'exact' })
        .eq('host_id', user!.id)
      if (activeWorkspace) hostQuery = hostQuery.eq('workspace_id', activeWorkspace.id)

      const [{ count: hostCount }, { data: parts }, { data: persistent }] = await Promise.all([
        hostQuery,
        supabase.from('participants').select('room_id, approved').eq('user_id', user!.id),
        supabase
          .from('rooms')
          .select('*')
          .eq('host_id', user!.id)
          .eq('is_persistent', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setHosted(hostCount ?? 0)
      const joinedRooms = new Set(
        (parts ?? []).filter((p) => p.approved).map((p) => p.room_id),
      )
      setJoined(joinedRooms.size)
      setPersistentRooms((persistent ?? []) as Room[])
    }

    void loadStats()
  }, [user, displayName, setDisplayName, activeWorkspace])

  async function performJoin(codeInput?: string) {
    if (!user) return
    const code = normalizeRoomCode(codeInput ?? joinCode)
    if (!code) {
      setError('Enter a meeting code')
      return
    }

    setLoading(true)
    setError(null)

    const { room, error: findError } = await findActiveRoom(code)
    if (findError || !room) {
      setError(findError ?? 'Meeting not found')
      setLoading(false)
      return
    }

    const isHost = room.host_id === user.id
    const access = canJoinRoom(room, user.id, isHost)
    if (!access.ok) {
      setError(access.error)
      setLoading(false)
      return
    }

    const pass = validatePasscode(room, passcode)
    if (!pass.ok) {
      setError(pass.error)
      setLoading(false)
      return
    }

    const { participant, error: joinError } = await joinRoomAsParticipant(
      room,
      user.id,
      displayName || user.displayName,
      isHost,
    )

    if (joinError || !participant) {
      setError(joinError ?? 'Could not join')
      setLoading(false)
      return
    }

    navigate(`/room/${room.id}`)
  }

  async function handleCreate() {
    if (!user) return
    setLoading(true)
    setError(null)

    const { room, error: createError } = await createRoom(user.id, displayName || user.displayName, {
      passcode: roomPasscode || undefined,
      waitingRoomEnabled: waitingRoom,
      workspaceId: activeWorkspace?.id ?? null,
    })

    if (createError || !room) {
      setError(createError ?? 'Failed to create')
      setLoading(false)
      return
    }

    navigate(`/room/${room.id}`)
  }

  async function handleSchedule() {
    if (!user || !scheduleAt) return
    setLoading(true)
    setError(null)

    const { room, error: createError } = await createRoom(user.id, displayName || user.displayName, {
      title: scheduleTitle || `${displayName || user.displayName}'s scheduled meeting`,
      scheduledAt: new Date(scheduleAt).toISOString(),
      isPersistent: true,
      passcode: roomPasscode || undefined,
      waitingRoomEnabled: waitingRoom,
      workspaceId: activeWorkspace?.id ?? null,
    })

    setLoading(false)
    if (createError || !room) {
      setError(createError ?? 'Failed to schedule')
      return
    }

    setScheduleTitle('')
    setScheduleAt('')
    setPersistentRooms((prev) => [room, ...prev])
  }

  const panelMotion = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <div className="mx-auto max-w-5xl">
      <motion.div {...panelMotion(0)}>
        <h1 className="font-display text-3xl text-[var(--paper-100)] sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--paper-400)]">
          Open a room or join with a code.
          {activeWorkspace && (
            <span className="ml-2 text-[var(--signal)]">· {activeWorkspace.name}</span>
          )}
        </p>
      </motion.div>

      <div className="relative mt-8 grid gap-4 lg:grid-cols-2">
        <div className="pointer-events-none absolute -right-4 -top-8 hidden h-40 w-40 opacity-40 lg:block">
          <SignalPulse compact />
        </div>

        <motion.section
          {...panelMotion(1)}
          className="rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] p-6"
        >
          <h2 className="font-display text-2xl text-[var(--paper-100)]">New meeting</h2>
          <p className="mt-2 text-sm text-[var(--paper-400)]">
            Generate a room and walk straight in as host.
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm text-[var(--paper-400)]">
            <input type="checkbox" checked={waitingRoom} onChange={(e) => setWaitingRoom(e.target.checked)} />
            Waiting room enabled
          </label>
          <input
            value={roomPasscode}
            onChange={(e) => setRoomPasscode(e.target.value)}
            placeholder="Optional passcode"
            className="mt-3 w-full border-b border-[var(--ink-700)] bg-transparent py-2 text-sm text-[var(--paper-100)] outline-none focus:border-[var(--signal)]"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="mt-6 inline-flex rounded-md bg-[var(--signal)] px-5 py-2.5 text-sm font-semibold text-[var(--on-signal)] disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Start meeting'}
          </button>
        </motion.section>

        <motion.section
          {...panelMotion(2)}
          className="rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] p-6"
        >
          <h2 className="font-display text-2xl text-[var(--paper-100)]">Join a meeting</h2>
          <p className="mt-2 text-sm text-[var(--paper-400)]">Paste the room code you were given.</p>
          <label className="mt-6 block">
            <span className="font-mono mb-2 block text-[10px] uppercase tracking-[0.14em] text-[var(--paper-400)]">
              Room code
            </span>
            <input
              ref={joinRef}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void performJoin()
              }}
              placeholder="xyz-abcd-efg"
              className="font-mono w-full border-0 border-b border-[var(--ink-700)] bg-transparent py-2.5 text-sm tracking-wide text-[var(--paper-100)] outline-none focus:border-[var(--signal)]"
            />
          </label>
          <input
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode (if required)"
            className="mt-4 w-full border-b border-[var(--ink-700)] bg-transparent py-2 text-sm text-[var(--paper-100)] outline-none focus:border-[var(--signal)]"
          />
          <button
            type="button"
            onClick={() => performJoin()}
            disabled={loading}
            className="mt-6 inline-flex rounded-md border border-[var(--paper-100)] px-5 py-2.5 text-sm font-semibold text-[var(--paper-100)] disabled:opacity-50"
          >
            Join
          </button>
        </motion.section>
      </div>

      <motion.section
        {...panelMotion(3)}
        className="mt-4 rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] p-6"
      >
        <h2 className="font-display text-xl text-[var(--paper-100)]">Schedule meeting</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
            placeholder="Meeting title"
            className="border-b border-[var(--ink-700)] bg-transparent py-2 text-sm text-[var(--paper-100)] outline-none focus:border-[var(--signal)]"
          />
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="border-b border-[var(--ink-700)] bg-transparent py-2 text-sm text-[var(--paper-100)] outline-none focus:border-[var(--signal)]"
          />
        </div>
        <button
          type="button"
          onClick={handleSchedule}
          disabled={loading || !scheduleAt}
          className="mt-4 rounded-md bg-[var(--signal)] px-5 py-2.5 text-sm font-semibold text-[var(--on-signal)] disabled:opacity-50"
        >
          Schedule
        </button>
      </motion.section>

      {persistentRooms.length > 0 && (
        <motion.section {...panelMotion(4)} className="mt-4 rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] p-6">
          <h2 className="font-display text-xl text-[var(--paper-100)]">Persistent rooms</h2>
          <ul className="mt-4 space-y-2">
            {persistentRooms.map((room) => (
              <li key={room.id} className="flex items-center justify-between rounded-md border border-[var(--ink-700)] px-3 py-2">
                <div>
                  <p className="text-sm text-[var(--paper-100)]">{room.title ?? room.room_code}</p>
                  <p className="font-mono text-xs text-[var(--paper-400)]">{room.room_code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/room/${room.id}`)}
                  className="text-xs text-[var(--signal)] hover:underline"
                >
                  Rejoin
                </button>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <motion.div {...panelMotion(5)} className="mt-10 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] px-4 py-4">
          <p className="font-mono text-2xl text-[var(--paper-100)]">{hostedDisplay}</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--paper-400)]">
            Meetings hosted
          </p>
        </div>
        <div className="rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] px-4 py-4">
          <p className="font-mono text-2xl text-[var(--paper-100)]">{joinedDisplay}</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--paper-400)]">
            Meetings joined
          </p>
        </div>
      </motion.div>
    </div>
  )
}
