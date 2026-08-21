import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Eraser,
  Highlighter,
  Minus,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useMeetingStore } from '../../store/useMeetingStore'
import {
  useWhiteboard,
  type WbPoint,
  type WbStroke,
  type WbTool,
} from '../../hooks/useWhiteboard'
import { PanelCloseButton } from './PanelCloseButton'
import { RoomPanelPortal } from './RoomPanelPortal'

const COLORS = ['#111827', '#ffffff', '#dc2626', '#ea580c', '#eab308', '#16a34a', '#2563eb', '#7c3aed']
const WIDTHS = [
  { id: 'thin', value: 2, label: 'Thin' },
  { id: 'medium', value: 4, label: 'Medium' },
  { id: 'thick', value: 8, label: 'Thick' },
] as const

const BOARD_BG = '#f8fafc'

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: WbStroke,
  width: number,
  height: number,
) {
  if (stroke.points.length === 0) return
  const pts = stroke.points.map((p) => ({ x: p.x * width, y: p.y * height }))

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.lineWidth = stroke.width * 3
  } else if (stroke.tool === 'highlighter') {
    ctx.globalCompositeOperation = 'multiply'
    ctx.strokeStyle = stroke.color
    ctx.globalAlpha = 0.35
    ctx.lineWidth = stroke.width * 4
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = stroke.color
    ctx.globalAlpha = 1
    ctx.lineWidth = stroke.width
  }

  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y)
  }
  if (pts.length === 1) {
    ctx.lineTo(pts[0].x + 0.01, pts[0].y)
  }
  ctx.stroke()
  ctx.restore()
}

function redrawBoard(
  canvas: HTMLCanvasElement,
  strokes: WbStroke[],
  draft: WbStroke | null,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width, height } = canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = BOARD_BG
  ctx.fillRect(0, 0, width, height)
  for (const s of strokes) drawStroke(ctx, s, width, height)
  if (draft) drawStroke(ctx, draft, width, height)
}

function downsample(points: WbPoint[], minDist = 0.002): WbPoint[] {
  if (points.length <= 2) return points
  const out: WbPoint[] = [points[0]]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = out[out.length - 1]
    const cur = points[i]
    const dx = cur.x - prev.x
    const dy = cur.y - prev.y
    if (dx * dx + dy * dy >= minDist * minDist) out.push(cur)
  }
  out.push(points[points.length - 1])
  return out
}

export function WhiteboardPanel() {
  const open = useMeetingStore((s) => s.whiteboardOpen)
  const setWhiteboardOpen = useMeetingStore((s) => s.setWhiteboardOpen)
  const {
    strokes,
    localIdentity,
    publishStroke,
    undoLastOwn,
    clearBoard,
    createStrokeId,
  } = useWhiteboard(open)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const draftPointsRef = useRef<WbPoint[]>([])
  const strokeMetaRef = useRef<{ id: string; tool: WbTool; color: string; width: number } | null>(
    null,
  )

  const [tool, setTool] = useState<WbTool>('pen')
  const [color, setColor] = useState(COLORS[0])
  const [width, setWidth] = useState<number>(WIDTHS[1].value)
  const [draft, setDraft] = useState<WbStroke | null>(null)

  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const rect = wrap.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = Math.max(1, Math.floor(rect.width))
    const cssH = Math.max(1, Math.floor(rect.height))
    canvas.width = Math.floor(cssW * dpr)
    canvas.height = Math.floor(cssH * dpr)
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
    redrawBoard(canvas, strokes, draft)
  }, [strokes, draft])

  useEffect(() => {
    if (!open) return
    fitCanvas()
    const ro = new ResizeObserver(() => fitCanvas())
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('resize', fitCanvas)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', fitCanvas)
    }
  }, [open, fitCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !open) return
    redrawBoard(canvas, strokes, draft)
  }, [strokes, draft, open])

  function normPoint(e: React.PointerEvent<HTMLCanvasElement>): WbPoint | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0) return
    const pt = normPoint(e)
    if (!pt) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const id = createStrokeId()
    strokeMetaRef.current = { id, tool, color, width }
    draftPointsRef.current = [pt]
    setDraft({
      id,
      from: localIdentity,
      tool,
      color,
      width,
      points: [pt],
    })
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !strokeMetaRef.current) return
    const pt = normPoint(e)
    if (!pt) return
    draftPointsRef.current.push(pt)
    const meta = strokeMetaRef.current
    setDraft({
      id: meta.id,
      from: localIdentity,
      tool: meta.tool,
      color: meta.color,
      width: meta.width,
      points: [...draftPointsRef.current],
    })
  }

  async function finishStroke() {
    if (!drawingRef.current || !strokeMetaRef.current) return
    drawingRef.current = false
    const meta = strokeMetaRef.current
    strokeMetaRef.current = null
    const points = downsample(draftPointsRef.current)
    draftPointsRef.current = []
    setDraft(null)
    if (points.length === 0) return
    await publishStroke({
      id: meta.id,
      from: localIdentity,
      tool: meta.tool,
      color: meta.color,
      width: meta.width,
      points,
    })
  }

  if (!open) return null

  const toolBtn = (t: WbTool, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      key={t}
      onClick={() => setTool(t)}
      title={label}
      aria-label={label}
      aria-pressed={tool === t}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition ${
        tool === t
          ? 'bg-[var(--accent)] text-[var(--on-accent)]'
          : 'bg-[var(--bg)] text-[var(--text)] hover:border-[var(--accent)]'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )

  return (
    <RoomPanelPortal>
      <div className="room-shell fixed inset-0 z-[120] flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:px-4">
          <h3 className="mr-1 text-sm font-semibold sm:mr-2">Whiteboard</h3>

          <div className="flex items-center gap-1.5">
            {toolBtn('pen', 'Pen', <Pencil className="h-4 w-4" />)}
            {toolBtn('highlighter', 'Highlighter', <Highlighter className="h-4 w-4" />)}
            {toolBtn('eraser', 'Eraser', <Eraser className="h-4 w-4" />)}
          </div>

          <div className="mx-1 hidden h-6 w-px bg-[var(--border)] sm:block" />

          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c)
                  if (tool === 'eraser') setTool('pen')
                }}
                aria-label={`Color ${c}`}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  color === c && tool !== 'eraser'
                    ? 'border-[var(--accent)] scale-110'
                    : 'border-[var(--border)]'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="mx-1 hidden h-6 w-px bg-[var(--border)] sm:block" />

          <div className="flex items-center gap-1">
            {WIDTHS.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setWidth(w.value)}
                title={w.label}
                aria-label={w.label}
                aria-pressed={width === w.value}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  width === w.value
                    ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:bg-[var(--bg)]'
                }`}
              >
                <Minus className="h-4 w-4" style={{ strokeWidth: w.value }} />
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void undoLastOwn()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--bg)] px-2.5 text-xs font-medium text-[var(--text)] transition hover:text-[var(--accent)]"
              title="Undo your last stroke"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Undo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear the whiteboard for everyone?')) void clearBoard()
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--bg)] px-2.5 text-xs font-medium text-[var(--meetra-danger)] transition hover:bg-[var(--meetra-danger)]/10"
              title="Clear board for everyone"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <PanelCloseButton onClick={() => setWhiteboardOpen(false)} label="Close whiteboard" />
          </div>
        </div>

        <div ref={wrapRef} className="min-h-0 flex-1 p-2 sm:p-4 pb-28 sm:pb-24">
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none rounded-xl border border-[var(--border)] shadow-sm cursor-crosshair"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => void finishStroke()}
            onPointerCancel={() => void finishStroke()}
            onPointerLeave={() => {
              if (drawingRef.current) void finishStroke()
            }}
          />
        </div>
      </div>
    </RoomPanelPortal>
  )
}
