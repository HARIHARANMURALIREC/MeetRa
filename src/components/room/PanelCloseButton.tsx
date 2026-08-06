import { X } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

export function PanelCloseButton({
  label = 'Close',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`rounded-md p-1 text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--text)] ${className}`}
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  )
}
