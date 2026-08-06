import { useEffect, useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'

/** Uses LiveKit's server-side active speaker detection (no per-participant AudioContext). */
export function useActiveSpeaker() {
  const room = useRoomContext()
  const [dominantSpeakerId, setDominantSpeakerId] = useState<string | null>(
    room.activeSpeakers[0]?.identity ?? null,
  )

  useEffect(() => {
    function update() {
      setDominantSpeakerId(room.activeSpeakers[0]?.identity ?? null)
    }

    update()
    room.on(RoomEvent.ActiveSpeakersChanged, update)
    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, update)
    }
  }, [room])

  return { dominantSpeakerId }
}
