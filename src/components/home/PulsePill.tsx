import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Pill/tag that flashes accent border once on mount. */
export function PulsePill({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()

  return (
    <motion.span
      className={`inline-block border px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] ${className}`}
      initial={
        reduce
          ? false
          : { borderColor: 'var(--accent)', opacity: 0, y: 8 }
      }
      animate={{
        borderColor: 'var(--border)',
        opacity: 1,
        y: 0,
      }}
      transition={
        reduce
          ? { duration: 0 }
          : {
              opacity: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
              y: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
              borderColor: { duration: 0.55, delay: 0.35, ease: 'easeOut' },
            }
      }
    >
      {children}
    </motion.span>
  )
}
