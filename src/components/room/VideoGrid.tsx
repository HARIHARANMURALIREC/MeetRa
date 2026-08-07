import {
  CarouselLayout,
  GridLayout,
  ParticipantContext,
  isTrackReference,
  useTracks,
} from '@livekit/components-react'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react'
import type { ReactNode } from 'react'
import { Track } from 'livekit-client'
import { useActiveSpeaker } from '../../hooks/useActiveSpeaker'
import { DominantSpeakerContext } from './dominantSpeakerContext'
import { MeetraGridTile } from './MeetraGridTile'
import { ParticipantTile } from './ParticipantTile'

interface VideoGridProps {
  raisedHands?: Record<string, boolean>
}

function isActiveScreenShare(track: TrackReferenceOrPlaceholder) {
  if (!isTrackReference(track)) return false
  if (track.publication.source !== Track.Source.ScreenShare) return false
  if (track.publication.isMuted) return false
  return Boolean(track.publication.track) || track.publication.isSubscribed
}

export function VideoGrid({ raisedHands = {} }: VideoGridProps) {
  const { dominantSpeakerId } = useActiveSpeaker()
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )

  const screenShareTrack = tracks.find(isActiveScreenShare)

  const cameraTracks = tracks.filter(
    (track) => !isTrackReference(track) || track.publication.source === Track.Source.Camera,
  )

  const shellClass = 'video-grid-shell h-full min-h-0 pb-28 sm:pb-24'

  let content: ReactNode

  if (screenShareTrack) {
    const shareParticipant = screenShareTrack.participant
    content = (
      <div className={`${shellClass} video-grid-present`} data-lk-theme="default">
        {/* Google Meet–style: large share left, vertical 16:9 tiles on the right */}
        <div className="video-grid-present-stage">
          <ParticipantContext.Provider value={shareParticipant}>
            <ParticipantTile
              isDominant
              preferScreenShare
              fit="contain"
              raised={raisedHands[shareParticipant.identity] ?? false}
            />
          </ParticipantContext.Provider>
        </div>
        <aside className="video-grid-present-rail">
          <CarouselLayout
            tracks={cameraTracks}
            orientation="vertical"
            className="video-grid-carousel h-full w-full"
          >
            <MeetraGridTile raisedHands={raisedHands} filmstrip />
          </CarouselLayout>
        </aside>
      </div>
    )
  } else {
    content = (
      <div className={shellClass} data-lk-theme="default">
        <div className="lk-grid-layout-wrapper h-full w-full">
          <GridLayout tracks={cameraTracks} className="h-full w-full">
            <MeetraGridTile raisedHands={raisedHands} />
          </GridLayout>
        </div>
      </div>
    )
  }

  return (
    <DominantSpeakerContext.Provider value={dominantSpeakerId}>
      {content}
    </DominantSpeakerContext.Provider>
  )
}
