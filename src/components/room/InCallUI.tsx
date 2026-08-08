import { useCallback, useEffect, useRef, useState } from 'react'
import { VideoGrid } from './VideoGrid'
import { Controls } from './Controls'
import { ChatPanel } from './ChatPanel'
import { ParticipantsPanel } from './ParticipantsPanel'
import { PollsPanel } from './PollsPanel'
import { useRoomSignals } from '../../hooks/useRoomSignals'
import { RoomAudioRenderer, useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { useMeetingStore } from '../../store/useMeetingStore'

interface InCallUIProps {
  roomId: string
  roomCode?: string
  isHost: boolean
  onLeave: () => void
  onEndMeeting: () => void
}

const HIDE_MS = 3500

function useIsPhoneChrome() {
  const [isPhone, setIsPhone] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 639px), (pointer: coarse)').matches
      : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px), (pointer: coarse)')
    const sync = () => setIsPhone(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return isPhone
}

export function InCallUI({ roomId, roomCode, isHost, onLeave, onEndMeeting }: InCallUIProps) {
  const room = useRoomContext()
  const { reactions, raisedHands, sendReaction, setRaiseHand } = useRoomSignals()
  const { localParticipant } = useLocalParticipant()
  const handRaised = raisedHands[localParticipant.identity] ?? false
  const chatOpen = useMeetingStore((s) => s.chatOpen)
  const participantsOpen = useMeetingStore((s) => s.participantsOpen)
  const pollsOpen = useMeetingStore((s) => s.pollsOpen)
  const panelOpen = chatOpen || participantsOpen || pollsOpen

  const isPhone = useIsPhoneChrome()
  const [chromeVisible, setChromeVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHideTimer()
    if (!isPhone || panelOpen) return
    hideTimerRef.current = setTimeout(() => {
      setChromeVisible(false)
    }, HIDE_MS)
  }, [clearHideTimer, isPhone, panelOpen])

  const showChrome = useCallback(() => {
    setChromeVisible(true)
    scheduleHide()
  }, [scheduleHide])

  const toggleChrome = useCallback(() => {
    setChromeVisible((prev) => {
      const next = !prev
      if (next) {
        // schedule after state settles
        queueMicrotask(() => scheduleHide())
      } else {
        clearHideTimer()
      }
      return next
    })
  }, [clearHideTimer, scheduleHide])

  useEffect(() => {
    if (!isPhone) {
      setChromeVisible(true)
      clearHideTimer()
      return
    }
    if (panelOpen) {
      setChromeVisible(true)
      clearHideTimer()
      return
    }
    scheduleHide()
    return clearHideTimer
  }, [isPhone, panelOpen, scheduleHide, clearHideTimer])

  const disconnectThen = useCallback(
    async (next: () => void | Promise<void>) => {
      try {
        await room.disconnect()
      } catch {
        // Room may already be closing when the server ends the meeting.
      }
      await next()
    },
    [room],
  )

  const handleLeave = useCallback(() => disconnectThen(onLeave), [disconnectThen, onLeave])
  const handleEndMeeting = useCallback(() => disconnectThen(onEndMeeting), [disconnectThen, onEndMeeting])

  const chromeShown = !isPhone || chromeVisible

  return (
    <div className="room-shell relative flex h-dvh flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div
        className="min-h-0 flex-1"
        onPointerDown={(e) => {
          if (!isPhone) return
          // Ignore taps that land on interactive controls inside the grid
          const target = e.target as HTMLElement
          if (target.closest('button, a, input, textarea, select, [role="button"]')) return
          toggleChrome()
        }}
      >
        <VideoGrid raisedHands={raisedHands} compactBottom={!chromeShown && isPhone} />
      </div>
      <RoomAudioRenderer />
      {reactions.slice(-5).map((r, i) => (
        <div
          key={r.id}
          className="pointer-events-none absolute top-1/3 text-4xl animate-bounce"
          style={{
            left: `${42 + i * 4}%`,
            animationDelay: `${i * 120}ms`,
            animationDuration: '1.2s',
          }}
        >
          {r.emoji}
        </div>
      ))}
      <Controls
        onLeave={handleLeave}
        onEndMeeting={handleEndMeeting}
        roomCode={roomCode}
        isHost={isHost}
        onReact={sendReaction}
        onToggleRaiseHand={setRaiseHand}
        handRaised={handRaised}
        visible={chromeShown}
        onUserActivity={showChrome}
      />
      <ChatPanel roomId={roomId} />
      <ParticipantsPanel roomId={roomId} isHost={isHost} raisedHands={raisedHands} />
      <PollsPanel roomId={roomId} isHost={isHost} />
    </div>
  )
}
