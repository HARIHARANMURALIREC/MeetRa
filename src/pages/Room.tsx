import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LiveKitRoom } from '@livekit/components-react'
import { supabase } from '../lib/supabase'
import { useMeetingStore } from '../store/useMeetingStore'
import { useRoom } from '../hooks/useRoom'
import { PreJoin } from '../components/lobby/PreJoin'
import { WaitingRoom } from '../components/lobby/WaitingRoom'
import { PendingParticipants } from '../components/lobby/PendingParticipants'
import { InCallUI } from '../components/room/InCallUI'
import { LeaveScreen } from '../components/room/LeaveScreen'
import { callRoomAdmin } from '../lib/roomAdmin'
import { ensureNotificationPermission, notifyAdmitted } from '../lib/notifications'
import type { Participant, Room as RoomType } from '../types'

type RoomPhase = 'loading' | 'prejoin' | 'waiting' | 'incall' | 'left' | 'error'

export function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const user = useMeetingStore((s) => s.user)
  const userId = user?.id
  const displayName = useMeetingStore((s) => s.displayName)
  const isHost = useMeetingStore((s) => s.isHost)
  const isApproved = useMeetingStore((s) => s.isApproved)
  const hasLeft = useMeetingStore((s) => s.hasLeft)
  const meetingEnded = useMeetingStore((s) => s.meetingEnded)
  const micEnabled = useMeetingStore((s) => s.micEnabled)
  const cameraEnabled = useMeetingStore((s) => s.cameraEnabled)
  const audioDeviceId = useMeetingStore((s) => s.audioDeviceId)
  const videoDeviceId = useMeetingStore((s) => s.videoDeviceId)
  const cameraFacing = useMeetingStore((s) => s.cameraFacing)
  const setRoom = useMeetingStore((s) => s.setRoom)
  const setParticipant = useMeetingStore((s) => s.setParticipant)
  const setIsHost = useMeetingStore((s) => s.setIsHost)
  const setIsApproved = useMeetingStore((s) => s.setIsApproved)
  const setHasLeft = useMeetingStore((s) => s.setHasLeft)
  const setMeetingEnded = useMeetingStore((s) => s.setMeetingEnded)

  const [phase, setPhase] = useState<RoomPhase>('loading')
  const [room, setRoomData] = useState<RoomType | null>(null)
  const [participant, setParticipantData] = useState<Participant | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { token, wsUrl, loading: tokenLoading, error: tokenError, connect, disconnect } = useRoom()
  const intentionalLeaveRef = useRef(false)
  const loadedRoomIdRef = useRef<string | null>(null)
  const admittedNotifiedRef = useRef(false)

  useEffect(() => {
    if (!roomId || !userId || !user) return
    if (loadedRoomIdRef.current === roomId) return

    const currentUser = user
    let cancelled = false

    async function loadRoom() {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (cancelled) return
      if (roomError || !roomData) {
        setLoadError('Meeting not found')
        setPhase('error')
        return
      }

      if (!roomData.is_active) {
        setLoadError('This meeting has ended')
        setPhase('error')
        return
      }

      const { data: participantRows, error: pError } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id)
        .is('left_at', null)
        .order('joined_at', { ascending: false })
        .limit(1)

      if (cancelled) return
      const currentParticipant = participantRows?.[0]
      if (pError || !currentParticipant) {
        setLoadError('You are not a participant in this meeting')
        setPhase('error')
        return
      }

      const host = roomData.host_id === currentUser.id
      setRoomData(roomData)
      setParticipantData(currentParticipant)
      setRoom(roomData)
      setParticipant(currentParticipant)
      setIsHost(host)
      setIsApproved(host || currentParticipant.approved)
      loadedRoomIdRef.current = roomId!
      intentionalLeaveRef.current = false
      setPhase('prejoin')
    }

    void loadRoom()
    return () => {
      cancelled = true
    }
  }, [roomId, userId, user, setRoom, setParticipant, setIsHost, setIsApproved])

  const enterCall = async () => {
    if (!room) return
    if (!import.meta.env.VITE_LIVEKIT_WS_URL) {
      setPhase('incall')
      return
    }
    const name = displayName || user?.displayName || 'Guest'
    await connect(room.room_code, name)
  }

  useEffect(() => {
    if (!roomId || !participant || isApproved) return

    async function pollApproval() {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('id', participant!.id)
        .single()

      if (!data) return
      if (data.approved) {
        setIsApproved(true)
        setParticipant(data)
        setParticipantData(data)
        if (!admittedNotifiedRef.current) {
          admittedNotifiedRef.current = true
          notifyAdmitted()
        }
      } else if (data.left_at) {
        setLoadError('The host denied your request to join')
        setPhase('error')
      }
    }

    const channel = supabase
      .channel(`approval-${participant.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'participants', filter: `id=eq.${participant.id}` },
        (payload) => {
          const updated = payload.new as Participant
          if (updated.approved) {
            setIsApproved(true)
            setParticipant(updated)
            setParticipantData(updated)
            if (!admittedNotifiedRef.current) {
              admittedNotifiedRef.current = true
              notifyAdmitted()
            }
          }
          if (updated.left_at) {
            setLoadError('The host denied your request to join')
            setPhase('error')
          }
        },
      )
      .subscribe()

    void pollApproval()
    const interval = window.setInterval(() => void pollApproval(), 3000)
    return () => {
      window.clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [roomId, participant, isApproved, setIsApproved, setParticipant])

  useEffect(() => {
    if (phase === 'waiting') void ensureNotificationPermission()
  }, [phase])

  useEffect(() => {
    if (!roomId || !participant) return

    const channel = supabase
      .channel(`room-ended-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as RoomType
          if (!updated.is_active) {
            setMeetingEnded(true)
            disconnect()
            setPhase('left')
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'participants', filter: `id=eq.${participant.id}` },
        (payload) => {
          const updated = payload.new as Participant
          if (updated.left_at && !intentionalLeaveRef.current) {
            setLoadError('You were removed from the meeting')
            disconnect()
            setPhase('error')
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, participant, disconnect, setMeetingEnded])

  useEffect(() => {
    if (phase !== 'waiting' || !isApproved || !room) return
    void enterCall()
  }, [phase, isApproved, room])

  async function handleJoinCall() {
    if (!room) return
    if (!isApproved && !isHost) {
      setPhase('waiting')
      return
    }
    await enterCall()
  }

  useEffect(() => {
    if (token && wsUrl) setPhase('incall')
  }, [token, wsUrl])

  async function handleLeave() {
    intentionalLeaveRef.current = true
    if (participant) {
      await supabase
        .from('participants')
        .update({ left_at: new Date().toISOString() })
        .eq('id', participant.id)
    }
    disconnect()
    setHasLeft(true)
    setPhase('left')
  }

  async function handleEndMeeting() {
    if (!roomId || !isHost) return
    intentionalLeaveRef.current = true
    await callRoomAdmin({ action: 'end', roomId })
    if (participant) {
      await supabase
        .from('participants')
        .update({ left_at: new Date().toISOString() })
        .eq('id', participant.id)
    }
    disconnect()
    setMeetingEnded(true)
    setHasLeft(true)
    setPhase('left')
  }

  function handleDisconnected() {
    if (!intentionalLeaveRef.current) return
  }

  function handleRejoin() {
    intentionalLeaveRef.current = false
    admittedNotifiedRef.current = false
    setHasLeft(false)
    setMeetingEnded(false)
    disconnect()
    setPhase('prejoin')
  }

  if (phase === 'loading') {
    return (
      <div className="room-shell flex min-h-dvh items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    )
  }

  if (phase === 'error' || loadError) {
    return (
      <div className="room-shell flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-semibold text-[var(--meetra-danger)]">{loadError ?? 'Something went wrong'}</h2>
        <button type="button" onClick={() => navigate('/dashboard')} className="mt-6 rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--on-accent)]">
          Back to dashboard
        </button>
      </div>
    )
  }

  if (phase === 'left' || hasLeft) {
    return <LeaveScreen roomCode={room?.room_code} onRejoin={meetingEnded ? undefined : handleRejoin} ended={meetingEnded} />
  }

  if (phase === 'prejoin') {
    return (
      <PreJoin
        onJoin={handleJoinCall}
        joinLabel={isHost ? 'Start meeting' : isApproved ? 'Join now' : 'Ask to join'}
      />
    )
  }

  if (tokenLoading || (phase === 'waiting' && isApproved)) {
    return (
      <div className="room-shell flex h-dvh w-full flex-col items-center justify-center bg-[var(--bg)] px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        <p className="mt-4 text-sm text-[var(--muted)]">Joining meeting…</p>
      </div>
    )
  }

  if (phase === 'waiting') return <WaitingRoom />

  if (tokenError) {
    return (
      <div className="room-shell flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-semibold text-[var(--meetra-danger)]">Connection failed</h2>
        <p className="mt-2 text-[var(--muted)]">{tokenError}</p>
        <button type="button" onClick={() => setPhase('prejoin')} className="mt-6 rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--on-accent)]">
          Try again
        </button>
      </div>
    )
  }

  if (phase === 'incall' && token && wsUrl) {
    return (
      <div className="room-shell relative min-h-dvh">
        {isHost && roomId && <PendingParticipants roomId={roomId} />}
        <LiveKitRoom
          token={token}
          serverUrl={wsUrl}
          connect
          video={
            cameraEnabled
              ? videoDeviceId
                ? { deviceId: videoDeviceId }
                : { facingMode: cameraFacing }
              : false
          }
          audio={
            micEnabled
              ? audioDeviceId
                ? { deviceId: audioDeviceId }
                : true
              : false
          }
          onDisconnected={handleDisconnected}
          className="h-full min-h-dvh"
        >
          <InCallUI
            roomId={roomId!}
            roomCode={room?.room_code}
            isHost={isHost}
            onLeave={handleLeave}
            onEndMeeting={handleEndMeeting}
          />
        </LiveKitRoom>
      </div>
    )
  }

  if (phase === 'incall' && !token) {
    return (
      <div className="room-shell relative min-h-dvh bg-[var(--bg)]">
        {isHost && roomId && <PendingParticipants roomId={roomId} />}
        <div className="flex h-full flex-col items-center justify-center px-4 pb-24 text-center">
          <h2 className="text-xl font-semibold text-[var(--text)]">Call UI ready</h2>
          <p className="mt-2 max-w-md text-[var(--muted)]">LiveKit is not configured yet.</p>
          <button type="button" onClick={handleLeave} className="mt-6 rounded-lg bg-[var(--meetra-danger)] px-6 py-3 font-semibold text-white">
            Leave
          </button>
        </div>
      </div>
    )
  }

  return null
}
