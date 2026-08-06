import { useNavigate } from 'react-router-dom'
import { useMeetingStore } from '../../store/useMeetingStore'

interface LeaveScreenProps {
  roomCode?: string
  onRejoin?: () => void
  ended?: boolean
}

export function LeaveScreen({ roomCode, onRejoin, ended }: LeaveScreenProps) {
  const navigate = useNavigate()
  const reset = useMeetingStore((s) => s.reset)

  function handleReturnHome() {
    reset()
    navigate('/dashboard')
  }

  async function handleCopyInvite() {
    if (!roomCode) return
    await navigator.clipboard.writeText(`${window.location.origin}/?join=${roomCode}`)
  }

  return (
    <div className="room-shell flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-4 text-center text-[var(--text)]">
      <h2 className="text-2xl font-semibold">{ended ? 'Meeting ended' : 'You left the meeting'}</h2>
      <p className="mt-2 text-[var(--muted)]">Thanks for using Meetra</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {onRejoin && !ended && (
          <button type="button" onClick={onRejoin} className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--on-accent)]">
            Rejoin
          </button>
        )}
        <button type="button" onClick={handleReturnHome} className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--text)]">
          Back to dashboard
        </button>
        {roomCode && (
          <button type="button" onClick={handleCopyInvite} className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--text)]">
            Copy invite link
          </button>
        )}
      </div>
    </div>
  )
}
