import { useCallback } from 'react'
import { VideoGrid } from './VideoGrid'
import { Controls } from './Controls'
import { ChatPanel } from './ChatPanel'
import { ParticipantsPanel } from './ParticipantsPanel'
import { PollsPanel } from './PollsPanel'
import { useRoomSignals } from '../../hooks/useRoomSignals'
import { RoomAudioRenderer, useLocalParticipant, useRoomContext } from '@livekit/components-react'

interface InCallUIProps {
  roomId: string
  roomCode?: string
  isHost: boolean
  onLeave: () => void
  onEndMeeting: () => void
}

export function InCallUI({ roomId, roomCode, isHost, onLeave, onEndMeeting }: InCallUIProps) {
  const room = useRoomContext()
  const { reactions, raisedHands, sendReaction, setRaiseHand } = useRoomSignals()
  const { localParticipant } = useLocalParticipant()
  const handRaised = raisedHands[localParticipant.identity] ?? false

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

  return (
    <div className="room-shell relative flex h-dvh flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="min-h-0 flex-1">
        <VideoGrid raisedHands={raisedHands} />
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
      />
      <ChatPanel roomId={roomId} />
      <ParticipantsPanel roomId={roomId} isHost={isHost} raisedHands={raisedHands} />
      <PollsPanel roomId={roomId} isHost={isHost} />
    </div>
  )
}
