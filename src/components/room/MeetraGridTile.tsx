import { ParticipantContext, useTrackRefContext } from '@livekit/components-react'
import { ParticipantTile } from './ParticipantTile'
import { useDominantSpeakerId } from './dominantSpeakerContext'

interface MeetraGridTileProps {
  raisedHands?: Record<string, boolean>
}

export function MeetraGridTile({ raisedHands = {} }: MeetraGridTileProps) {
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
      />
    </ParticipantContext.Provider>
  )
}
