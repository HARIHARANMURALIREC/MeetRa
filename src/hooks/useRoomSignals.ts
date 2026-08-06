import { useCallback, useRef, useState } from 'react'
import { useDataChannel, useRoomContext } from '@livekit/components-react'

export type RoomSignal =
  | { type: 'reaction'; emoji: string; from: string; at: number }
  | { type: 'raise_hand'; raised: boolean; from: string; at: number }

export type FloatingReaction = {
  id: string
  emoji: string
  from: string
  at: number
}

const SIGNAL_TOPIC = 'signal'

function parseSignal(payload: Uint8Array): RoomSignal | null {
  try {
    return JSON.parse(new TextDecoder().decode(payload)) as RoomSignal
  } catch {
    return null
  }
}

export function useRoomSignals() {
  const room = useRoomContext()
  const [reactions, setReactions] = useState<FloatingReaction[]>([])
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({})
  const timeoutsRef = useRef<Map<string, number>>(new Map())

  const addReaction = useCallback((emoji: string, from: string) => {
    const id = `${from}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const item: FloatingReaction = { id, emoji, from, at: Date.now() }
    setReactions((prev) => [...prev.slice(-19), item])

    const existing = timeoutsRef.current.get(id)
    if (existing) window.clearTimeout(existing)

    const timeout = window.setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id))
      timeoutsRef.current.delete(id)
    }, 2500)
    timeoutsRef.current.set(id, timeout)
  }, [])

  const handleSignal = useCallback(
    (msg: { payload: Uint8Array; from?: { identity?: string } }) => {
      const parsed = parseSignal(msg.payload)
      if (!parsed) return

      const from = msg.from?.identity ?? parsed.from
      if (parsed.type === 'reaction' && parsed.emoji) {
        addReaction(parsed.emoji, from)
      }
      if (parsed.type === 'raise_hand') {
        setRaisedHands((prev) => ({ ...prev, [from]: parsed.raised }))
      }
    },
    [addReaction],
  )

  const { send } = useDataChannel(SIGNAL_TOPIC, handleSignal)

  const sendReaction = useCallback(
    async (emoji: string) => {
      const from = room.localParticipant.identity
      addReaction(emoji, from)
      await send(
        new TextEncoder().encode(
          JSON.stringify({
            type: 'reaction',
            emoji,
            from,
            at: Date.now(),
          } satisfies RoomSignal),
        ),
        { reliable: true },
      )
    },
    [room, send, addReaction],
  )

  const setRaiseHand = useCallback(
    async (raised: boolean) => {
      const from = room.localParticipant.identity
      setRaisedHands((prev) => ({ ...prev, [from]: raised }))
      await send(
        new TextEncoder().encode(
          JSON.stringify({
            type: 'raise_hand',
            raised,
            from,
            at: Date.now(),
          } satisfies RoomSignal),
        ),
        { reliable: true },
      )
    },
    [room, send],
  )

  return { reactions, raisedHands, sendReaction, setRaiseHand }
}
