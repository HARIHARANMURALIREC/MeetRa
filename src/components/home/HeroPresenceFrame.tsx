import { motion, useReducedMotion } from 'framer-motion'

export function HeroPresenceFrame() {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className="relative hidden aspect-[4/5] w-full max-w-md justify-self-end lg:flex"
      initial={reduce ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduce ? { duration: 0 } : { duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      <div className="absolute inset-0 border border-[var(--border)]">
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--border)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--border)]" />
        <div className="absolute inset-y-[12%] left-0 w-px bg-[var(--border)]" />
        <div className="absolute inset-y-[12%] right-0 w-px bg-[var(--border)]" />
      </div>

      <div className="absolute inset-[8%] border border-[var(--border)]/60 bg-[var(--surface)]/40">
        <div className="absolute left-4 top-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
          <motion.span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
            animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
            transition={reduce ? undefined : { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          Live · Grid
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
          <span>6 on air</span>
          <span>Page 1</span>
        </div>
        <div className="absolute inset-[18%] grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-sm border border-[var(--border)] bg-[var(--bg)]/80"
              initial={reduce ? false : { opacity: 0.4 }}
              animate={
                reduce
                  ? undefined
                  : {
                      opacity: i === 1 ? [0.55, 1, 0.55] : 0.7,
                      borderColor:
                        i === 1
                          ? ['var(--border)', 'var(--accent)', 'var(--border)']
                          : 'var(--border)',
                    }
              }
              transition={
                reduce
                  ? undefined
                  : { duration: 2.2, delay: i * 0.08, repeat: Infinity, ease: 'easeInOut' }
              }
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
