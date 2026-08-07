import { motion, useReducedMotion } from 'framer-motion'

interface SplitHeadlineProps {
  text: string
  className?: string
  /** Base delay before first word (seconds). */
  delay?: number
}

/** Word-by-word hero headline reveal with a tight spring. */
export function SplitHeadline({ text, className = '', delay = 0.08 }: SplitHeadlineProps) {
  const reduce = useReducedMotion()
  const words = text.split(' ')

  return (
    <h1 className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="flex flex-wrap gap-x-[0.28em]">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    type: 'spring',
                    stiffness: 380,
                    damping: 28,
                    delay: delay + i * 0.06,
                  }
            }
          >
            {word}
          </motion.span>
        ))}
      </span>
    </h1>
  )
}
