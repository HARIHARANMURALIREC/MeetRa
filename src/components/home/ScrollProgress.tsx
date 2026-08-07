import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion'

/** Thin accent progress bar fixed to the top of the viewport. */
export function ScrollProgress() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  })

  if (reduce) return null

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-[var(--accent)]"
      style={{ scaleX }}
      aria-hidden
    />
  )
}
