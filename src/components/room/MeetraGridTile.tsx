import { ParticipantContext, useTrackRefContext } from '@livekit/components-react'
import { ParticipantTile } from './ParticipantTile'
import { useDominantSpeakerId } from './dominantSpeakerContext'

interface MeetraGridTileProps {
  raisedHands?: Record<string, boolean>
  /** Bottom filmstrip during screen share — fixed 16:9 tiles, less crop. */
  filmstrip?: boolean
}

export function MeetraGridTile({ raisedHands = {}, filmstrip = false }: MeetraGridTileProps) {
  const trackRef = useTrackRefContext()
  const dominantSpeakerId = useDominantSpeakerId()
  const participant = trackRef.participant
  const isDominant =
    participant.identity === dominantSpeakerId || participant.isSpeaking

  return (
    <ParticipantContext.Provider value={participant}>
      <ParticipantTile
        isDominant={isDominant}
        raised={raisedHands[participant.identity] ?? false}
        filmstrip={filmstrip}
      />
    </ParticipantContext.Provider>
  )
}
