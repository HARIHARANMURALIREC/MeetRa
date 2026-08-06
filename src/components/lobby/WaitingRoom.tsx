export function WaitingRoom() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-[var(--bg)] px-4 text-center text-[var(--text)]">
      <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--accent)] opacity-60" />
      <h2 className="mt-6 text-2xl font-semibold">Waiting for host to let you in</h2>
      <p className="mt-2 max-w-sm text-[var(--muted)]">
        The meeting host has been notified. You&apos;ll join automatically once approved.
      </p>
    </div>
  )
}
