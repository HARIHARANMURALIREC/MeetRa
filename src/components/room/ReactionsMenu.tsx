import { forwardRef, useEffect, useRef } from 'react'
import { RoomPanelPortal } from './RoomPanelPortal'

const QUICK_EMOJIS = ['👍', '👏', '❤️', '😂', '🎉']
const MORE_EMOJIS = ['🔥', '👀', '🙌', '💯', '😮', '😢', '👎', '🎤', '💡', '✅']

interface ReactionsMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReact: (emoji: string) => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
}

export function ReactionsMenu({ open, onOpenChange, onReact, anchorRef }: ReactionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (menuRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onOpenChange(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, onOpenChange, anchorRef])

  if (!open) return null

  function pick(emoji: string) {
    onReact(emoji)
    onOpenChange(false)
  }

  const rect = anchorRef.current?.getBoundingClientRect()
  const left = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const bottom = rect ? window.innerHeight - rect.top + 8 : 80

  return (
    <RoomPanelPortal>
      <div
        ref={menuRef}
        className="room-shell fixed z-[110] w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-2xl"
        style={{ left, bottom }}
      >
        <p className="mb-2 text-center text-xs font-medium text-[var(--muted)]">Send a reaction</p>
        <div className="flex flex-wrap justify-center gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => pick(emoji)}
              className="rounded-lg px-2 py-1 text-xl transition hover:scale-110 hover:bg-[var(--bg)]"
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1 border-t border-[var(--border)] pt-2">
          {MORE_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => pick(emoji)}
              className="rounded-lg px-1 py-1 text-lg transition hover:scale-110 hover:bg-[var(--bg)]"
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </RoomPanelPortal>
  )
}

/** Control button with hover label tooltip */
export const ControlButtonWrap = forwardRef<
  HTMLButtonElement,
  {
    active: boolean
    onClick: () => void
    label: string
    icon: React.ReactNode
    highlightWhenInactive?: boolean
  }
>(function ControlButtonWrap(
  { active, onClick, label, icon, highlightWhenInactive = false },
  ref,
) {
  const buttonClass = active
    ? 'bg-[var(--control-active-bg)] text-[var(--control-active-fg)] ring-1 ring-[var(--accent)] shadow-[0_0_12px_var(--accent-dim)]'
    : highlightWhenInactive
      ? 'border border-[var(--control-idle-border)] bg-[var(--control-idle-bg)] text-[var(--text)] hover:border-[var(--control-hover-border)] hover:text-[var(--accent)]'
      : 'border border-[var(--control-idle-border)] bg-[var(--control-idle-bg)] text-[var(--control-idle-fg)] hover:border-[var(--control-hover-border)] hover:text-[var(--accent)]'

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onClick()
    e.currentTarget.blur()
  }

  return (
    <div className="group relative shrink-0">
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--accent)] px-2 py-1 text-[10px] font-medium text-[var(--on-accent)] opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
      >
        {label}
      </span>
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        aria-label={label}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition sm:h-11 sm:w-11 md:h-12 md:w-12 ${buttonClass}`}
      >
        {icon}
      </button>
    </div>
  )
})
