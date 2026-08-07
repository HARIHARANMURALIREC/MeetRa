import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/** Technical connection diagram — line draws in, then packet pulses along the path. */
export function ConnectionStatus({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()
  const [lineDone, setLineDone] = useState(Boolean(reduce))

  useEffect(() => {
    if (reduce) {
      setLineDone(true)
      return
    }
    const t = window.setTimeout(() => setLineDone(true), 950)
    return () => window.clearTimeout(t)
  }, [reduce])

  return (
    <motion.div
      className={`relative hidden w-full max-w-md justify-self-end lg:block ${className}`}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 0.35 }}
      aria-hidden
    >
      <div className="aspect-[4/5] w-full border border-[var(--border)] bg-[var(--surface)]/40 p-6">
        <div className="flex h-full flex-col justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Signal path
          </p>

          <svg viewBox="0 0 280 220" className="mx-auto w-full max-w-[280px]" fill="none">
            <motion.circle
              cx="40"
              cy="110"
              r="10"
              stroke="var(--accent)"
              strokeWidth="1.5"
              fill="var(--bg)"
              initial={reduce ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                reduce ? { duration: 0 } : { delay: 0.2, type: 'spring', stiffness: 320, damping: 22 }
              }
            />
            <motion.circle
              cx="240"
              cy="110"
              r="10"
              stroke="var(--accent)"
              strokeWidth="1.5"
              fill="var(--bg)"
              initial={reduce ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                reduce ? { duration: 0 } : { delay: 0.45, type: 'spring', stiffness: 320, damping: 22 }
              }
            />

            <motion.line
              x1="50"
              y1="110"
              x2="230"
              y2="110"
              stroke="var(--border)"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={
                reduce ? { duration: 0 } : { duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }
              }
            />

            {lineDone && !reduce && (
              <motion.circle
                cy="110"
                r="3.5"
                fill="var(--accent)"
                initial={{ cx: 50, opacity: 0 }}
                animate={{ cx: [50, 230], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 0.35 }}
              />
            )}
          </svg>

          <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            <span>Host</span>
            <span className="text-[var(--accent)]">{lineDone ? 'Linked' : 'Linking…'}</span>
            <span>Peer</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
