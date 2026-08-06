import { motion } from 'framer-motion'
import { useMotionConfig } from '../../hooks/useMotionConfig'

const GROUPS = [
  {
    label: 'Before the call',
    items: [
      { name: 'Instant rooms', detail: 'Create a meeting and share a code or link' },
      { name: 'Join by code', detail: 'Deep-link invites that survive login' },
      { name: 'Passcode lock', detail: 'Optional room password on create' },
      { name: 'Schedule & persist', detail: 'Timed rooms you can rejoin later' },
      { name: 'Pre-join lobby', detail: 'Preview cam, pick devices, set your name' },
      { name: 'Waiting room', detail: 'Host admits guests before they go live' },
    ],
  },
  {
    label: 'On the call',
    items: [
      { name: 'Adaptive video grid', detail: 'Layouts that grow, then paginate' },
      { name: 'Active speaker', detail: 'Highlight who is talking' },
      { name: 'Screen share', detail: 'Focus share with a participant filmstrip' },
      { name: 'Chat & files', detail: 'Realtime messages and attachments' },
      { name: 'Reactions & hands', detail: 'Emoji reactions and raise hand' },
      { name: 'Live polls', detail: 'Create, vote, and close mid-meeting' },
      { name: 'Host controls', detail: 'Mute, remove, or end for everyone' },
      { name: 'Invite in-call', detail: 'Copy the join link without leaving' },
    ],
  },
  {
    label: 'After & around',
    items: [
      { name: 'Meeting history', detail: 'Hosted and joined calls with duration' },
      { name: 'Notes & chat export', detail: 'Save notes; export chat as text or JSON' },
      { name: 'Workspaces', detail: 'Personal space or team-scoped rooms' },
      { name: 'Profiles', detail: 'Display name and avatar' },
      { name: 'Light & dark', detail: 'Appearance that follows your preference' },
      { name: 'Google sign-in', detail: 'Auth before media; tokens after approval' },
    ],
  },
]

export function FeaturesIndex() {
  const { viewFadeUp } = useMotionConfig()

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.p
          {...viewFadeUp(0)}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]"
        >
          Full feature set
        </motion.p>
        <motion.h2
          {...viewFadeUp(0.06)}
          className="font-display mt-3 max-w-2xl text-3xl text-[var(--text)] sm:text-4xl"
        >
          Everything Meetra ships today.
        </motion.h2>
        <motion.p
          {...viewFadeUp(0.1)}
          className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base"
        >
          From lobby to leave screen — the tools that keep a room clear, useful, and under control.
        </motion.p>

        <div className="mt-14 grid gap-12 border-t border-[var(--border)] pt-12 lg:grid-cols-3 lg:gap-10">
          {GROUPS.map((group, gi) => (
            <motion.div key={group.label} {...viewFadeUp(0.08 + gi * 0.06)}>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                {String(gi + 1).padStart(2, '0')} · {group.label}
              </p>
              <ul className="mt-5 space-y-4">
                {group.items.map((item) => (
                  <li key={item.name} className="border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
                    <p className="font-display text-lg text-[var(--text)]">{item.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
