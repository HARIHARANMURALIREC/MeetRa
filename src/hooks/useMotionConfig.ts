import { useReducedMotion } from 'framer-motion'

/** Shared motion helpers that respect prefers-reduced-motion. */
export function useMotionConfig() {
  const reduce = useReducedMotion()
  return {
    reduce: Boolean(reduce),
    fadeUp: (delay = 0) =>
      reduce
        ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
        : {
            initial: { opacity: 0, y: 12 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
          },
    viewFadeUp: (delay = 0, xFrom = 0) =>
      reduce
        ? {
            initial: { opacity: 1 },
            whileInView: { opacity: 1 },
            viewport: { once: true, amount: 0.35 },
            transition: { duration: 0 },
          }
        : {
            initial: { opacity: 0, y: 16, x: xFrom },
            whileInView: { opacity: 1, y: 0, x: 0 },
            viewport: { once: true, amount: 0.35 },
            transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
          },
  }
}
