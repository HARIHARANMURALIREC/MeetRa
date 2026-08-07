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
  /** Filmstrip tile during screen share — enforce 16:9 framing. */
  filmstrip?: boolean
  /** How video fills the tile. Screen share defaults to contain. */
  fit?: 'cover' | 'contain'
}

export function ParticipantTile({
  isDominant = false,
  raised = false,
  preferScreenShare = false,
  filmstrip = false,
  fit,
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
  const objectFit = fit ?? (showingScreen ? 'contain' : 'cover')

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
      className={`relative overflow-hidden rounded-xl bg-[var(--surface)] ${
        filmstrip
          ? 'h-full w-full'
          : 'flex h-full min-h-0 flex-col'
      } ${
        isDominant || isSpeaking
          ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]'
          : 'ring-1 ring-[var(--border)]'
      }`}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`bg-black ${
            filmstrip
              ? 'absolute inset-0 h-full w-full object-cover object-center'
              : `h-full w-full flex-1 ${objectFit === 'contain' ? 'object-contain' : 'object-cover object-center'}`
          }`}
        />
      ) : (
        <div
          className={`flex items-center justify-center bg-[var(--surface)] ${
            filmstrip ? 'absolute inset-0' : 'h-full min-h-[5rem] flex-1'
          }`}
        >
          <span
            className={`font-bold text-[var(--muted)] ${filmstrip ? 'text-2xl' : 'text-4xl'}`}
          >
            {name[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
      )}
      <div
        className={`absolute bottom-1.5 left-1.5 z-[1] flex max-w-[calc(100%-0.75rem)] items-center gap-1.5 rounded-md bg-black/60 px-1.5 py-0.5 ${
          filmstrip ? 'text-[10px]' : 'text-sm'
        }`}
      >
        <span className="truncate">{name}</span>
        {raised && (
          <Hand className="h-3 w-3 shrink-0 text-[var(--accent)]" aria-label="Raised hand" />
        )}
        {participant.isMicrophoneEnabled === false && (
          <MicOff className="h-3 w-3 shrink-0 text-[var(--meetra-danger)]" aria-label="Muted" />
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
