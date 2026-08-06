import { Hand, MicOff, Monitor } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { Participant as LiveKitParticipant } from 'livekit-client'
import { Track } from 'livekit-client'
import { useParticipantContext } from '@livekit/components-react'
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator'

interface ParticipantTileProps {
  isDominant?: boolean
  raised?: boolean
  /** When true, prefer screen-share track over camera (focus layout only). */
  preferScreenShare?: boolean
}

export function ParticipantTile({
  isDominant = false,
  raised = false,
  preferScreenShare = false,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const participant = useParticipantContext()

  const videoPublication = participant.getTrackPublication(Track.Source.Camera)
  const screenPublication = participant.getTrackPublication(Track.Source.ScreenShare)

  const activeScreen =
    preferScreenShare &&
    screenPublication &&
    !screenPublication.isMuted &&
    Boolean(screenPublication.track || screenPublication.isSubscribed)
      ? screenPublication
      : null

  const publication = activeScreen ?? videoPublication
  const track = publication?.track
  const isSpeaking = participant.isSpeaking
  const name = participant.name || participant.identity
  const showingScreen = publication?.source === Track.Source.ScreenShare

  useEffect(() => {
    const el = videoRef.current
    if (!el || !track) return

    track.attach(el)
    return () => {
      track.detach(el)
    }
  }, [track])

  const showVideo = Boolean(track)

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-[var(--surface)] ${
        isDominant || isSpeaking
          ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]'
          : 'ring-1 ring-[var(--border)]'
      }`}
    >
      {showVideo ? (
        <video ref={videoRef} autoPlay playsInline className="h-full w-full flex-1 object-cover" />
      ) : (
        <div className="flex h-full min-h-[5rem] flex-1 items-center justify-center bg-[var(--surface)]">
          <span className="text-4xl font-bold text-[var(--muted)]">
            {name[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-md bg-black/60 px-2 py-1 text-sm">
        <span className="truncate">{name}</span>
        {raised && (
          <Hand className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-label="Raised hand" />
        )}
        {participant.isMicrophoneEnabled === false && (
          <MicOff className="h-3.5 w-3.5 shrink-0 text-[var(--meetra-danger)]" aria-label="Muted" />
        )}
        <ConnectionQualityIndicator participant={participant as LiveKitParticipant} />
      </div>
      {showingScreen && (
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-xs">
          <Monitor className="h-3 w-3" />
          Screen
        </span>
      )}
    </div>
  )
}
