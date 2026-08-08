import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, SwitchCamera, Video, VideoOff } from 'lucide-react'
import { useMeetingStore } from '../../store/useMeetingStore'
import { buildMediaConstraints, useMediaDevices } from '../../hooks/useMediaDevices'
import { flipPreviewCamera } from '../../lib/cameraFlip'

interface PreJoinProps {
  onJoin: () => void
  joinLabel: string
}

export function PreJoin({ onJoin, joinLabel }: PreJoinProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const displayName = useMeetingStore((s) => s.displayName)
  const user = useMeetingStore((s) => s.user)
  const micEnabled = useMeetingStore((s) => s.micEnabled)
  const cameraEnabled = useMeetingStore((s) => s.cameraEnabled)
  const audioDeviceId = useMeetingStore((s) => s.audioDeviceId)
  const videoDeviceId = useMeetingStore((s) => s.videoDeviceId)
  const cameraFacing = useMeetingStore((s) => s.cameraFacing)
  const setDisplayName = useMeetingStore((s) => s.setDisplayName)
  const setMicEnabled = useMeetingStore((s) => s.setMicEnabled)
  const setCameraEnabled = useMeetingStore((s) => s.setCameraEnabled)
  const setAudioDeviceId = useMeetingStore((s) => s.setAudioDeviceId)
  const setVideoDeviceId = useMeetingStore((s) => s.setVideoDeviceId)
  const setCameraFacing = useMeetingStore((s) => s.setCameraFacing)
  const { audioInputs, videoInputs, refresh } = useMediaDevices()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flipping, setFlipping] = useState(false)

  const canFlipCamera =
    videoInputs.length > 1 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

  useEffect(() => {
    let mounted = true

    async function startPreview() {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          buildMediaConstraints(
            audioDeviceId || undefined,
            videoDeviceId || undefined,
            videoDeviceId ? undefined : cameraFacing,
          ),
        )
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.style.transform = cameraFacing === 'user' ? 'scaleX(-1)' : 'none'
        }
        const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId
        if (activeId && !videoDeviceId) {
          setVideoDeviceId(activeId)
        }
        await refresh()
        setLoading(false)
      } catch {
        setError('Camera/mic access denied. You can still join with toggles off.')
        setLoading(false)
      }
    }

    void startPreview()
    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
    // refresh intentionally omitted — stable enough; avoid restart loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioDeviceId, videoDeviceId, cameraFacing, setVideoDeviceId])

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = micEnabled
    })
  }, [micEnabled])

  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = cameraEnabled
    })
    if (videoRef.current) videoRef.current.style.display = cameraEnabled ? 'block' : 'none'
  }, [cameraEnabled])

  async function handleFlipCamera() {
    if (flipping || !cameraEnabled) return
    setFlipping(true)
    try {
      const next = await flipPreviewCamera(videoInputs, videoDeviceId, cameraFacing)
      if (!next) return
      setCameraFacing(next.facing)
      setVideoDeviceId(next.deviceId)
    } finally {
      setFlipping(false)
    }
  }

  return (
    <div className="room-shell flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-4 text-[var(--text)]">
      <div className="w-full max-w-2xl">
        <h2 className="mb-6 text-center text-2xl font-semibold">Ready to join?</h2>

        <div className="relative aspect-video overflow-hidden rounded-xl bg-[var(--surface)]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
          )}
          {!cameraEnabled && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <span className="text-6xl font-bold text-[var(--muted)]">
                  {(displayName || user?.displayName || '?')[0]?.toUpperCase()}
                </span>
              )}
            </div>
          )}
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          {canFlipCamera && cameraEnabled && !loading && (
            <button
              type="button"
              onClick={() => void handleFlipCamera()}
              disabled={flipping}
              className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-50"
              aria-label={cameraFacing === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
              title={cameraFacing === 'user' ? 'Back camera' : 'Front camera'}
            >
              <SwitchCamera className={`h-5 w-5 ${flipping ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-center text-sm text-[var(--meetra-danger)]">{error}</p>}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-[var(--muted)]">
            Microphone
            <select
              value={audioDeviceId}
              onChange={(e) => setAudioDeviceId(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-[var(--text)]"
            >
              <option value="">Default</option>
              {audioInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'Microphone'}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[var(--muted)]">
            Camera
            <select
              value={videoDeviceId}
              onChange={(e) => {
                setVideoDeviceId(e.target.value)
                const label = videoInputs.find((d) => d.deviceId === e.target.value)?.label ?? ''
                if (/back|rear|environment/i.test(label)) setCameraFacing('environment')
                else setCameraFacing('user')
              }}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-[var(--text)]"
            >
              <option value="">Default</option>
              {videoInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'Camera'}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setMicEnabled(!micEnabled)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              micEnabled
                ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {micEnabled ? 'Mic on' : 'Mic off'}
          </button>
          <button
            type="button"
            onClick={() => setCameraEnabled(!cameraEnabled)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              cameraEnabled
                ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            {cameraEnabled ? 'Camera on' : 'Camera off'}
          </button>
          {canFlipCamera && (
            <button
              type="button"
              onClick={() => void handleFlipCamera()}
              disabled={!cameraEnabled || flipping}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              <SwitchCamera className="h-4 w-4" />
              {cameraFacing === 'user' ? 'Back cam' : 'Front cam'}
            </button>
          )}
        </div>

        <label className="mt-6 block text-sm font-medium text-[var(--muted)]">
          Display name
          <input
            type="text"
            value={displayName || user?.displayName || ''}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <button
          type="button"
          onClick={onJoin}
          className="mt-6 w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-[var(--on-accent)]"
        >
          {joinLabel}
        </button>
      </div>
    </div>
  )
}
