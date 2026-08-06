import { motion } from 'framer-motion'
import { useMotionConfig } from '../../hooks/useMotionConfig'

const BEATS = [
  { label: 'Share', line: 'Mint a code or link. Optional passcode.' },
  { label: 'Connect', line: 'Pre-join, waiting room, then admit.' },
  { label: 'Live', line: 'Grid, share, chat, polls — host keeps control.' },
]

export function BeatsStrip() {
  const { viewFadeUp, reduce } = useMotionConfig()

  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface)] px-4 py-14 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3 sm:gap-0">
        {BEATS.map((beat, i) => (
          <motion.div
            key={beat.label}
            {...viewFadeUp(i * 0.1)}
            className={`relative sm:px-8 ${i === 0 ? 'sm:pl-0' : ''} ${i === BEATS.length - 1 ? 'sm:pr-0' : ''}`}
          >
            {i > 0 && (
              <motion.div
                className="absolute bottom-0 left-0 top-0 hidden w-px origin-top bg-[var(--border)] sm:block"
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={reduce ? { duration: 0 } : { duration: 0.6, delay: 0.1 + i * 0.08 }}
                aria-hidden
              />
            )}
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
              {String(i + 1).padStart(2, '0')} · {beat.label}
            </p>
            <p className="font-display mt-3 text-xl text-[var(--text)] sm:text-2xl">{beat.line}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
