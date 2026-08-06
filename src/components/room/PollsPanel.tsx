import { useState } from 'react'
import { useMeetingStore } from '../../store/useMeetingStore'
import { usePolls } from '../../hooks/usePolls'
import { PanelCloseButton } from './PanelCloseButton'
import { RoomPanelPortal } from './RoomPanelPortal'

interface PollsPanelProps {
  roomId: string
  isHost?: boolean
}

export function PollsPanel({ roomId, isHost }: PollsPanelProps) {
  const pollsOpen = useMeetingStore((s) => s.pollsOpen)
  const setPollsOpen = useMeetingStore((s) => s.setPollsOpen)
  const user = useMeetingStore((s) => s.user)
  const { polls, createPoll, vote, closePoll, votesForPoll } = usePolls(roomId)
  const [question, setQuestion] = useState('')
  const [optionsText, setOptionsText] = useState('Yes\nNo')

  if (!pollsOpen) return null

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const options = optionsText.split('\n').map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || options.length < 2) return
    await createPoll(question.trim(), options, user.id)
    setQuestion('')
    setOptionsText('Yes\nNo')
  }

  return (
    <RoomPanelPortal>
      <div className="room-shell fixed inset-x-0 bottom-[7rem] z-[100] flex h-[min(50vh,24rem)] flex-col rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:inset-x-auto sm:bottom-0 sm:left-0 sm:right-auto sm:top-0 sm:h-dvh sm:max-h-none sm:w-80 sm:rounded-none sm:rounded-r-2xl sm:border-r sm:border-t-0">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="font-semibold text-[var(--text)]">Polls</h3>
          <PanelCloseButton onClick={() => setPollsOpen(false)} label="Close polls" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {isHost && (
          <form onSubmit={handleCreate} className="mb-4 space-y-2 border-b border-[var(--border)] pb-4">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Poll question"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 text-sm text-[var(--text)] outline-none"
            />
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={3}
              placeholder="One option per line"
              className="w-full resize-none border border-[var(--border)] bg-[var(--bg)] p-2 text-sm text-[var(--text)]"
            />
            <button type="submit" className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--on-accent)]">
              Create poll
            </button>
          </form>
        )}

        {polls.map((poll) => {
          const pollVotes = votesForPoll(poll.id)
          const total = pollVotes.length
          return (
            <div key={poll.id} className="mb-4 rounded-lg border border-[var(--border)] p-3">
              <p className="text-sm font-medium text-[var(--text)]">{poll.question}</p>
              <ul className="mt-2 space-y-2">
                {poll.options.map((opt, i) => {
                  const count = pollVotes.filter((v) => v.option_index === i).length
                  const pct = total ? Math.round((count / total) * 100) : 0
                  const voted = pollVotes.some((v) => v.user_id === user?.id)
                  return (
                    <li key={opt}>
                      {poll.closed_at || voted ? (
                        <div>
                          <div className="flex justify-between text-xs text-[var(--muted)]">
                            <span>{opt}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-[var(--border)]">
                            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => user && vote(poll.id, i, user.id)}
                          className="w-full rounded-md border border-[var(--border)] px-2 py-1.5 text-left text-sm text-[var(--text)] hover:border-[var(--accent)]"
                        >
                          {opt}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
              {isHost && !poll.closed_at && (
                <button type="button" onClick={() => closePoll(poll.id)} className="mt-2 text-xs text-[var(--accent)]">
                  Close poll
                </button>
              )}
            </div>
          )
        })}
        </div>
      </div>
    </RoomPanelPortal>
  )
}
