import {
  CarouselLayout,
  FocusLayoutContainer,
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
  // Do not restrict updates to ActiveSpeakersChanged — screen share start/stop
  // must refresh the layout or the UI stays blank after stopping share.
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

  const tile = <MeetraGridTile raisedHands={raisedHands} />
  const shellClass = 'video-grid-shell h-full min-h-0 pb-28 sm:pb-24'

  let content: ReactNode

  if (screenShareTrack) {
    const shareParticipant = screenShareTrack.participant
    content = (
      <div className={shellClass} data-lk-theme="default">
        <FocusLayoutContainer className="video-grid-focus h-full !grid-cols-1 !grid-rows-[minmax(0,1fr)_auto] sm:!grid-cols-[minmax(0,1fr)_5fr] sm:!grid-rows-1">
          <CarouselLayout
            tracks={cameraTracks}
            orientation="horizontal"
            className="video-grid-carousel order-2 min-h-0 sm:order-1"
          >
            {tile}
          </CarouselLayout>
          <div className="min-h-0 order-1 sm:order-2">
            <ParticipantContext.Provider value={shareParticipant}>
              <ParticipantTile
                isDominant
                preferScreenShare
                raised={raisedHands[shareParticipant.identity] ?? false}
              />
            </ParticipantContext.Provider>
          </div>
        </FocusLayoutContainer>
      </div>
    )
  } else {
    content = (
      <div className={shellClass} data-lk-theme="default">
        <div className="lk-grid-layout-wrapper h-full w-full">
          <GridLayout tracks={cameraTracks} className="h-full w-full">
            {tile}
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
