import { motion, useReducedMotion } from 'framer-motion'

interface SignalPulseProps {
  compact?: boolean
  className?: string
}

/** Rings-only pulse for dashboard — geometric, amber signal. */
export function SignalPulse({ compact = true, className = '' }: SignalPulseProps) {
  const reduce = useReducedMotion()
  const size = compact ? 160 : 280
  const cx = size / 2
  const cy = size / 2
  const maxR = compact ? 62 : 110

  if (reduce) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={className} aria-hidden>
        <circle cx={cx} cy={cy} r={6} fill="var(--signal)" />
        <circle cx={cx} cy={cy} r={maxR * 0.5} fill="none" stroke="var(--signal)" strokeWidth={1} opacity={0.35} />
      </svg>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      className={className}
      aria-hidden
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          fill="none"
          stroke="var(--signal)"
          strokeWidth={1}
          initial={{ r: maxR * 0.12, opacity: 0.6 }}
          animate={{ r: maxR, opacity: 0 }}
          transition={{
            duration: 2.4,
            delay: i * 0.6,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
      <circle cx={cx} cy={cy} r={6} fill="var(--signal)" />
    </svg>
  )
}
