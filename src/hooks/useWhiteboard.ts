import { useCallback, useEffect, useRef, useState } from 'react'
import { useDataChannel, useRoomContext } from '@livekit/components-react'

export type WbTool = 'pen' | 'highlighter' | 'eraser'

export type WbPoint = { x: number; y: number }

export type WbStroke = {
  id: string
  from: string
  tool: WbTool
  color: string
  width: number
  points: WbPoint[]
}

export type WbMsg =
  | { type: 'stroke'; stroke: WbStroke }
  | { type: 'undo'; id: string; from: string }
  | { type: 'clear'; from: string }
  | { type: 'snapshot_request'; from: string }
  | { type: 'snapshot'; strokes: WbStroke[]; from: string }

const WB_TOPIC = 'whiteboard'
const encoder = new TextEncoder()
const decoder = new TextDecoder()

function parseMsg(payload: Uint8Array): WbMsg | null {
  try {
    return JSON.parse(decoder.decode(payload)) as WbMsg
  } catch {
    return null
  }
}

function mergeStrokes(existing: WbStroke[], incoming: WbStroke[]): WbStroke[] {
  const byId = new Map<string, WbStroke>()
  for (const s of existing) byId.set(s.id, s)
  for (const s of incoming) {
    if (!byId.has(s.id)) byId.set(s.id, s)
  }
  return Array.from(byId.values())
}

export function useWhiteboard(enabled: boolean) {
  const room = useRoomContext()
  const [strokes, setStrokes] = useState<WbStroke[]>([])
  const strokesRef = useRef(strokes)
  strokesRef.current = strokes

  const sendRef = useRef<(payload: WbMsg) => Promise<void>>(async () => {})
  const snapshotRequestedRef = useRef(false)

  const handleMsg = useCallback(
    (msg: { payload: Uint8Array; from?: { identity?: string } }) => {
      const parsed = parseMsg(msg.payload)
      if (!parsed) return
      const from =
        msg.from?.identity ??
        ('from' in parsed ? String((parsed as { from?: string }).from ?? '') : '')
      const localId = room.localParticipant.identity

      if (parsed.type === 'stroke') {
        setStrokes((prev) => {
          if (prev.some((s) => s.id === parsed.stroke.id)) return prev
          return [...prev, parsed.stroke]
        })
        return
      }

      if (parsed.type === 'undo') {
        setStrokes((prev) => prev.filter((s) => s.id !== parsed.id))
        return
      }

      if (parsed.type === 'clear') {
        setStrokes([])
        return
      }

      if (parsed.type === 'snapshot_request') {
        if (from === localId) return
        const current = strokesRef.current
        if (current.length === 0) return
        void sendRef.current({ type: 'snapshot', strokes: current, from: localId })
        return
      }

      if (parsed.type === 'snapshot') {
        if (from === localId) return
        setStrokes((prev) => mergeStrokes(prev, parsed.strokes))
      }
    },
    [room],
  )

  const { send } = useDataChannel(WB_TOPIC, handleMsg)

  const sendRaw = useCallback(
    async (payload: WbMsg) => {
      await send(encoder.encode(JSON.stringify(payload)), { reliable: true })
    },
    [send],
  )
  sendRef.current = sendRaw

  useEffect(() => {
    if (!enabled || snapshotRequestedRef.current) return
    snapshotRequestedRef.current = true
    void sendRaw({ type: 'snapshot_request', from: room.localParticipant.identity })
  }, [enabled, room, sendRaw])

  const publishStroke = useCallback(
    async (stroke: WbStroke) => {
      setStrokes((prev) => {
        if (prev.some((s) => s.id === stroke.id)) return prev
        return [...prev, stroke]
      })
      await sendRaw({ type: 'stroke', stroke })
    },
    [sendRaw],
  )

  const undoLastOwn = useCallback(async () => {
    const from = room.localParticipant.identity
    const own = [...strokesRef.current].reverse().find((s) => s.from === from)
    if (!own) return
    setStrokes((prev) => prev.filter((s) => s.id !== own.id))
    await sendRaw({ type: 'undo', id: own.id, from })
  }, [room, sendRaw])

  const clearBoard = useCallback(async () => {
    setStrokes([])
    await sendRaw({ type: 'clear', from: room.localParticipant.identity })
  }, [room, sendRaw])

  const createStrokeId = useCallback(() => {
    return `${room.localParticipant.identity}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }, [room])

  return {
    strokes,
    localIdentity: room.localParticipant.identity,
    publishStroke,
    undoLastOwn,
    clearBoard,
    createStrokeId,
  }
}
