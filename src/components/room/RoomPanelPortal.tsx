import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/** Render in-call panels on document.body so fixed positioning isn't broken by LiveKit transforms. */
export function RoomPanelPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
