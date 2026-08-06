import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMotionConfig } from '../../hooks/useMotionConfig'
import { Button } from '../ui/Button'

const SAMPLE_CODE = 'xyz-abcd-efg'

export function RoomCodeRitual() {
  const { viewFadeUp, reduce } = useMotionConfig()
  const [copied, setCopied] = useState(false)
  const [flash, setFlash] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(SAMPLE_CODE)
      setCopied(true)
      setFlash(true)
      window.setTimeout(() => setFlash(false), 800)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface)] px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div {...viewFadeUp(0)}>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
            The invite
          </p>
          <h2 className="font-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
            The key is the invite.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Share a short code or a deep link. Optional passcode. Waiting room until you admit.
            Guests land in the lobby — not mid-call by accident.
          </p>
          <ul className="mt-6 space-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
            <li>Code or link · same room</li>
            <li>Passcode · optional lock</li>
            <li>Admit · host gate</li>
          </ul>
        </motion.div>

        <motion.div
          {...viewFadeUp(0.1)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6 sm:p-8"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Sample room code
          </p>
          <p
            className={`font-mono mt-4 text-2xl tracking-wider sm:text-3xl transition-colors duration-300 ${
              flash ? 'text-[var(--accent)]' : 'text-[var(--text)]'
            }`}
          >
            {SAMPLE_CODE}
          </p>
          <div className="mt-6">
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy sample'}
            </Button>
          </div>
          {!reduce && (
            <motion.p
              key={copied ? 'yes' : 'no'}
              initial={{ opacity: 0 }}
              animate={{ opacity: copied ? 1 : 0 }}
              className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]"
            >
              Decorative only — does not open a room
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
