import { facingModeFromLocalTrack, Room, Track } from 'livekit-client'
import type { LocalTrack } from 'livekit-client'

export type CameraFacing = 'user' | 'environment'

function labelLooksLikeBack(label: string) {
  const l = label.toLowerCase()
  return (
    l.includes('back') ||
    l.includes('rear') ||
    l.includes('environment') ||
    l.includes('world')
  )
}

function labelLooksLikeFront(label: string) {
  const l = label.toLowerCase()
  return (
    l.includes('front') ||
    l.includes('user') ||
    l.includes('face') ||
    l.includes('selfie')
  )
}

/** Pick the next camera device for a front/back flip. */
export function pickNextVideoDevice(
  devices: MediaDeviceInfo[],
  currentDeviceId: string,
  preferFacing?: CameraFacing,
): MediaDeviceInfo | null {
  const cams = devices.filter((d) => d.kind === 'videoinput' && d.deviceId)
  if (cams.length < 2) return null

  if (preferFacing) {
    const match =
      preferFacing === 'environment'
        ? cams.find((d) => labelLooksLikeBack(d.label))
        : cams.find((d) => labelLooksLikeFront(d.label))
    if (match && match.deviceId !== currentDeviceId) return match
  }

  const idx = Math.max(
    0,
    cams.findIndex((d) => d.deviceId === currentDeviceId),
  )
  return cams[(idx + 1) % cams.length] ?? null
}

export function facingFromTrack(track: LocalTrack | MediaStreamTrack | undefined): CameraFacing {
  if (!track) return 'user'
  return facingModeFromLocalTrack(track).facingMode === 'environment' ? 'environment' : 'user'
}

/** Flip camera in an active LiveKit room (mobile front ↔ back). */
export async function flipLiveKitCamera(room: Room): Promise<{ deviceId: string; facing: CameraFacing }> {
  const pub = room.localParticipant.getTrackPublication(Track.Source.Camera)
  const videoTrack = pub?.videoTrack
  const mediaTrack = videoTrack?.mediaStreamTrack
  const currentFacing = facingFromTrack(videoTrack ?? mediaTrack)
  const nextFacing: CameraFacing = currentFacing === 'user' ? 'environment' : 'user'

  const devices = await Room.getLocalDevices('videoinput', true)
  const currentId =
    mediaTrack?.getSettings().deviceId ??
    room.getActiveDevice('videoinput') ??
    ''

  const nextDevice = pickNextVideoDevice(devices, currentId, nextFacing)

  if (nextDevice) {
    await room.switchActiveDevice('videoinput', nextDevice.deviceId)
    return { deviceId: nextDevice.deviceId, facing: nextFacing }
  }

  // Fallback: restart capture with facingMode (works on many mobile browsers)
  const wasEnabled = room.localParticipant.isCameraEnabled
  if (wasEnabled) {
    await room.localParticipant.setCameraEnabled(false)
  }
  await room.localParticipant.setCameraEnabled(true, { facingMode: nextFacing })
  const after = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack
  const afterId = after?.mediaStreamTrack?.getSettings().deviceId ?? ''
  return { deviceId: afterId, facing: nextFacing }
}

/** Flip preview stream outside LiveKit (PreJoin). */
export async function flipPreviewCamera(
  devices: MediaDeviceInfo[],
  currentDeviceId: string,
  currentFacing: CameraFacing = 'user',
): Promise<{ deviceId: string; facing: CameraFacing } | null> {
  const nextFacing: CameraFacing = currentFacing === 'user' ? 'environment' : 'user'
  const next = pickNextVideoDevice(devices, currentDeviceId, nextFacing)
  if (next) {
    return { deviceId: next.deviceId, facing: nextFacing }
  }
  // No second device listed yet — still signal facing preference for getUserMedia
  return { deviceId: '', facing: nextFacing }
}
