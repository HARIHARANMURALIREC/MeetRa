import { motion } from 'framer-motion'
import { useMotionConfig } from '../../hooks/useMotionConfig'

const CAPABILITIES = [
  {
    label: 'Adaptive grid',
    title: 'Five people. Fifteen. Still clear.',
    body: 'Tiles resize to the room — then paginate when the call grows, so every face stays readable.',
  },
  {
    label: 'Waiting room',
    title: 'Admit when you\'re ready.',
    body: 'Guests wait outside until the host opens the door — with a notify when you\'re let in.',
  },
  {
    label: 'In-call tools',
    title: 'Chat, polls, reactions, files.',
    body: 'Pass links, attach files, vote mid-call, raise a hand, react live — without leaving the room.',
  },
  {
    label: 'Screen share',
    title: 'Show the work, not the window chrome.',
    body: 'Share a display mid-call; everyone else stays in a filmstrip beside the share.',
  },
  {
    label: 'Host controls',
    title: 'Mute. Remove. End when done.',
    body: 'Hosts keep the line clean — mute a noisy mic, remove a guest, or close the meeting for all.',
  },
  {
    label: 'History & notes',
    title: 'What happened stays findable.',
    body: 'Revisit hosted and joined meetings, add notes, and export chat when you need a record.',
  },
]

export function CapabilitiesReel() {
  const { viewFadeUp } = useMotionConfig()

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.p
          {...viewFadeUp(0)}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]"
        >
          Highlights
        </motion.p>
        <motion.h2
          {...viewFadeUp(0.06)}
          className="font-display mt-3 max-w-lg text-3xl text-[var(--text)] sm:text-4xl"
        >
          Built for calls that fill the frame.
        </motion.h2>

        <ul className="mt-14 space-y-0 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {CAPABILITIES.map((item, i) => {
            const fromRight = i % 2 === 1
            return (
              <motion.li
                key={item.label}
                {...viewFadeUp(0.05 + i * 0.06, fromRight ? 16 : -16)}
                className={`grid gap-3 py-10 sm:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] sm:gap-10 ${
                  fromRight ? 'sm:text-right' : ''
                }`}
              >
                <div className={fromRight ? 'sm:order-2' : ''}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    {String(i + 1).padStart(2, '0')} · {item.label}
                  </p>
                  <h3 className="font-display mt-2 text-2xl text-[var(--text)] sm:text-3xl">
                    {item.title}
                  </h3>
                </div>
                <p
                  className={`max-w-md text-sm leading-relaxed text-[var(--muted)] sm:text-base ${
                    fromRight ? 'sm:order-1 sm:ml-auto' : ''
                  }`}
                >
                  {item.body}
                </p>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
