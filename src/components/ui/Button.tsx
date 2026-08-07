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
  /** Hero primary CTA: slow idle glow breath + spring content nudge on hover. */
  breathe?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'relative bg-[var(--accent)] text-[var(--on-accent)] font-semibold overflow-visible',
  secondary:
    'border border-[var(--text)] bg-transparent text-[var(--text)] hover:bg-[var(--text)]/5',
  ghost: 'relative bg-transparent text-[var(--muted)] hover:text-[var(--text)]',
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
  breathe = false,
}: ButtonProps) {
  const reduce = useReducedMotion()
  const springHover =
    !reduce && variant === 'primary'
      ? { type: 'spring' as const, stiffness: 400, damping: 17 }
      : { duration: 0.1 }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      whileTap={disabled || loading || reduce ? undefined : { scale: 0.97 }}
      whileHover={
        disabled || loading || reduce || variant !== 'primary'
          ? undefined
          : { boxShadow: '0 0 0 1px var(--accent), 0 0 12px var(--accent-dim)' }
      }
      transition={springHover}
      disabled={disabled || loading}
      className={`group inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
    >
      {variant === 'primary' && breathe && !reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-md"
          style={{ boxShadow: '0 0 0 1px var(--accent-dim)' }}
          animate={{ opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {variant === 'primary' && !reduce && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: '0 0 0 1px var(--accent)' }}
        />
      )}
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="opacity-80">Please wait…</span>
        </span>
      ) : (
        <motion.span
          className="inline-flex items-center gap-2"
          whileHover={
            reduce || variant !== 'primary' ? undefined : { x: 2 }
          }
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {children}
        </motion.span>
      )}
    </motion.button>
  )
}
