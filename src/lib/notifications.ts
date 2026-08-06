export function notifyAdmitted() {
  if (typeof window === 'undefined') return

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification("You're in", {
      body: 'Host admitted you — joining now',
      icon: '/vite.svg',
    })
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) return

  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
    osc.onended = () => void ctx.close()
  } catch {
    /* audio unavailable */
  }
}

export async function ensureNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}
