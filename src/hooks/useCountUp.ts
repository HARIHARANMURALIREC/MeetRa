import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Count from 0 to `value` over ~600ms on mount. */
export function useCountUp(value: number, duration = 600) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)
  const started = useRef(false)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    if (started.current && value === display) return
    started.current = true
    const start = performance.now()
    let raf = 0

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) * (1 - t)
      setDisplay(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reduce])

  return display
}
