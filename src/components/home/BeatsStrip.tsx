import { motion, useReducedMotion } from 'framer-motion'
import { useMotionConfig } from '../../hooks/useMotionConfig'

const BEATS = [
  { label: 'Share', line: 'Mint a code or link. Optional passcode.' },
  { label: 'Connect', line: 'Pre-join, waiting room, then admit.' },
  { label: 'Live', line: 'Grid, share, chat, polls — host keeps control.' },
]

export function BeatsStrip() {
  const { reduce } = useMotionConfig()
  const prefersReduce = useReducedMotion()

  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface)] px-4 py-14 sm:px-6">
      <div className="relative mx-auto max-w-6xl">
        <motion.div
          className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-5 hidden h-px origin-left bg-[var(--border)] sm:block"
          initial={prefersReduce ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={
            prefersReduce ? { duration: 0 } : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
          }
          aria-hidden
        />

        <div className="grid gap-10 sm:grid-cols-3 sm:gap-0">
          {BEATS.map((beat, i) => {
            const numeralDelay = 0.15 + i * 0.22
            const contentDelay = numeralDelay + 0.08
            return (
              <div
                key={beat.label}
                className={`relative sm:px-8 ${i === 0 ? 'sm:pl-0' : ''} ${
                  i === BEATS.length - 1 ? 'sm:pr-0' : ''
                }`}
              >
                <motion.p
                  className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]"
                  initial={reduce ? false : { opacity: 0, scale: 1.18 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 420,
                          damping: 24,
                          delay: numeralDelay,
                        }
                  }
                >
                  {String(i + 1).padStart(2, '0')} · {beat.label}
                </motion.p>
                <motion.p
                  className="font-display mt-3 text-xl text-[var(--text)] sm:text-2xl"
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          duration: 0.4,
                          delay: contentDelay,
                          ease: [0.22, 1, 0.36, 1],
                        }
                  }
                >
                  {beat.line}
                </motion.p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
