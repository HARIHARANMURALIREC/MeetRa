import { useRef, useState } from 'react'
import {
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react'
import {
  BarChart3,
  Hand,
  Link2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  Smile,
  SwitchCamera,
  Users,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react'
import { useMeetingStore } from '../../store/useMeetingStore'
import { flipLiveKitCamera } from '../../lib/cameraFlip'
import { ControlButtonWrap, ReactionsMenu } from './ReactionsMenu'

interface ControlsProps {
  onLeave: () => void
  onEndMeeting: () => void
  roomCode?: string
  isHost?: boolean
  onReact: (emoji: string) => void
  onToggleRaiseHand: (raised: boolean) => void
  handRaised?: boolean
  /** Phone auto-hide chrome; desktop always true. */
  visible?: boolean
  onUserActivity?: () => void
}

export function Controls({
  onLeave,
  onEndMeeting,
  roomCode,
  isHost,
  onReact,
  onToggleRaiseHand,
  handRaised = false,
  visible = true,
  onUserActivity,
}: ControlsProps) {
  const room = useRoomContext()
  const localParticipant = useLocalParticipant()
  const chatOpen = useMeetingStore((s) => s.chatOpen)
  const participantsOpen = useMeetingStore((s) => s.participantsOpen)
  const pollsOpen = useMeetingStore((s) => s.pollsOpen)
  const noiseSuppressionEnabled = useMeetingStore((s) => s.noiseSuppressionEnabled)
  const setChatOpen = useMeetingStore((s) => s.setChatOpen)
  const setParticipantsOpen = useMeetingStore((s) => s.setParticipantsOpen)
  const setPollsOpen = useMeetingStore((s) => s.setPollsOpen)
  const setNoiseSuppressionEnabled = useMeetingStore((s) => s.setNoiseSuppressionEnabled)
  const setVideoDeviceId = useMeetingStore((s) => s.setVideoDeviceId)
  const setCameraFacing = useMeetingStore((s) => s.setCameraFacing)

  const [reactionsOpen, setReactionsOpen] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const reactionsRef = useRef<HTMLButtonElement>(null)

  const micEnabled = localParticipant.isMicrophoneEnabled
  const cameraEnabled = localParticipant.isCameraEnabled
  const screenShareEnabled = localParticipant.isScreenShareEnabled
  const showFlipCamera =
    cameraEnabled &&
    (typeof window === 'undefined' ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
      window.matchMedia('(pointer: coarse)').matches)

  async function toggleMic() {
    await room.localParticipant.setMicrophoneEnabled(!micEnabled)
  }

  async function toggleCamera() {
    await room.localParticipant.setCameraEnabled(!cameraEnabled)
  }

  async function toggleScreenShare() {
    await room.localParticipant.setScreenShareEnabled(!screenShareEnabled)
  }

  async function flipCamera() {
    if (flipping || !cameraEnabled) return
    setFlipping(true)
    try {
      const result = await flipLiveKitCamera(room)
      if (result.deviceId) setVideoDeviceId(result.deviceId)
      setCameraFacing(result.facing)
    } catch {
      /* device may not support flip */
    } finally {
      setFlipping(false)
    }
  }

  async function copyInvite() {
    if (!roomCode) return
    await navigator.clipboard.writeText(`${window.location.origin}/?join=${roomCode}`)
  }

  return (
    <>
      <ReactionsMenu
        open={reactionsOpen}
        onOpenChange={setReactionsOpen}
        onReact={onReact}
        anchorRef={reactionsRef}
      />
      <div
        className={`room-shell fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] px-2 pb-3 pt-7 transition-transform duration-300 ease-out sm:px-4 ${
          visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        onPointerDown={() => onUserActivity?.()}
        aria-hidden={!visible}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-2 gap-y-2">
          <div aria-hidden className="hidden min-w-0 sm:block" />
          <div className="col-span-3 flex min-w-0 flex-wrap items-center justify-center gap-x-1.5 gap-y-2 pb-1 sm:col-span-1 sm:gap-x-2">
            <ControlButtonWrap
              active={micEnabled}
              onClick={toggleMic}
              label={micEnabled ? 'Mute' : 'Unmute'}
              icon={micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            />
            <ControlButtonWrap
              active={cameraEnabled}
              onClick={toggleCamera}
              label={cameraEnabled ? 'Stop video' : 'Start video'}
              icon={cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            />
            {showFlipCamera && (
              <ControlButtonWrap
                active={false}
                onClick={() => void flipCamera()}
                label={flipping ? 'Switching…' : 'Flip camera'}
                icon={<SwitchCamera className={`h-5 w-5 ${flipping ? 'animate-spin' : ''}`} />}
                highlightWhenInactive
              />
            )}
            <ControlButtonWrap
              active={screenShareEnabled}
              onClick={toggleScreenShare}
              label={screenShareEnabled ? 'Stop sharing' : 'Share screen'}
              icon={<MonitorUp className="h-5 w-5" />}
            />
            <ControlButtonWrap
              active={noiseSuppressionEnabled}
              onClick={() => setNoiseSuppressionEnabled(!noiseSuppressionEnabled)}
              label="Noise filter"
              icon={<Volume2 className="h-5 w-5" />}
            />
            <ControlButtonWrap
              ref={reactionsRef}
              active={reactionsOpen}
              onClick={() => setReactionsOpen((o) => !o)}
              label="Reactions"
              icon={<Smile className="h-5 w-5" />}
              highlightWhenInactive
            />
            <ControlButtonWrap
              active={handRaised}
              onClick={() => onToggleRaiseHand(!handRaised)}
              label={handRaised ? 'Lower hand' : 'Raise hand'}
              icon={<Hand className="h-5 w-5" />}
              highlightWhenInactive
            />
            <ControlButtonWrap
              active={chatOpen}
              onClick={() => setChatOpen(!chatOpen)}
              label="Chat"
              icon={<MessageSquare className="h-5 w-5" />}
            />
            <ControlButtonWrap
              active={participantsOpen}
              onClick={() => setParticipantsOpen(!participantsOpen)}
              label="People"
              icon={<Users className="h-5 w-5" />}
            />
            <ControlButtonWrap
              active={pollsOpen}
              onClick={() => setPollsOpen(!pollsOpen)}
              label="Polls"
              icon={<BarChart3 className="h-5 w-5" />}
            />
            {roomCode && (
              <ControlButtonWrap
                active={false}
                onClick={copyInvite}
                label="Copy invite"
                icon={<Link2 className="h-5 w-5" />}
                highlightWhenInactive
              />
            )}
          </div>
          <div className="col-span-3 flex shrink-0 items-center justify-end gap-2 sm:col-span-1">
            {isHost ? (
              <>
                <ActionButton label="End meeting" onClick={onEndMeeting}>
                  End
                </ActionButton>
                <ActionButton label="Leave meeting" onClick={onLeave} variant="ghost">
                  Leave
                </ActionButton>
              </>
            ) : (
              <ActionButton label="Leave meeting" onClick={onLeave}>
                Leave
              </ActionButton>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function ActionButton({
  label,
  onClick,
  variant = 'danger',
  children,
}: {
  label: string
  onClick: () => void
  variant?: 'danger' | 'ghost'
  children: React.ReactNode
}) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onClick()
    e.currentTarget.blur()
  }

  return (
    <div className="group relative shrink-0">
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--accent)] px-2 py-1 text-[10px] font-medium text-[var(--on-accent)] opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
      >
        {label}
      </span>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === 'danger'
            ? 'shrink-0 rounded-full bg-[var(--meetra-danger)] px-3 py-2 text-sm font-semibold text-white sm:px-5 sm:py-2.5 md:px-6 md:py-3'
            : 'shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] sm:px-4 sm:py-2.5 md:py-3'
        }
      >
        {children}
      </button>
    </div>
  )
}
