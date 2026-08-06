import { motion } from 'framer-motion'
import { useMotionConfig } from '../../hooks/useMotionConfig'
import { Button } from '../ui/Button'

interface ClosingCueProps {
  onNewMeeting: () => void
  onJoin: () => void
  onLogin: () => void
  loading?: boolean
  isAuthenticated: boolean
}

export function ClosingCue({
  onNewMeeting,
  onJoin,
  onLogin,
  loading,
  isAuthenticated,
}: ClosingCueProps) {
  const { viewFadeUp } = useMotionConfig()

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
      <div className="cine-vignette absolute inset-0 opacity-90" aria-hidden />
      <div className="cine-grain absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl text-center">
        <motion.h2
          {...viewFadeUp(0)}
          className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.05] text-[var(--text)]"
        >
          Open the line.
        </motion.h2>
        <motion.p
          {...viewFadeUp(0.08)}
          className="mx-auto mt-4 max-w-md text-sm text-[var(--muted)] sm:text-base"
        >
          Sign in, share a code, admit the room — grid, chat, polls, and host tools included.
        </motion.p>
        <motion.div
          {...viewFadeUp(0.16)}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button onClick={onNewMeeting} loading={loading} className="w-full sm:w-auto">
            New meeting
          </Button>
          <Button variant="secondary" onClick={onJoin} className="w-full sm:w-auto">
            Join with a code
          </Button>
          {!isAuthenticated && (
            <Button variant="ghost" onClick={onLogin} className="w-full sm:w-auto">
              Log in
            </Button>
          )}
        </motion.div>
      </div>
    </section>
  )
}
