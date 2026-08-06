import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps {
  variant?: Variant
  loading?: boolean
  children: ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  onHoverStart?: () => void
  onHoverEnd?: () => void
}

const variantClasses: Record<Variant, string> = {
  primary:
    'relative bg-[var(--accent)] text-[var(--on-accent)] font-semibold overflow-visible',
  secondary:
    'border border-[var(--text)] bg-transparent text-[var(--text)] hover:bg-[var(--text)]/5',
  ghost: 'bg-transparent text-[var(--muted)] hover:text-[var(--text)]',
}

export function Button({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  type = 'button',
  onClick,
  onHoverStart,
  onHoverEnd,
}: ButtonProps) {
  const reduce = useReducedMotion()

  return (
    <motion.button
      type={type}
      onClick={onClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      whileTap={disabled || loading || reduce ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || loading}
      className={`group inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
    >
      {variant === 'primary' && !reduce && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-[accent-ring_0.55s_ease-out]"
          style={{ boxShadow: '0 0 0 1px var(--accent-dim)' }}
        />
      )}
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="opacity-80">Please wait…</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}
