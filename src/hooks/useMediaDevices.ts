import { useCallback, useEffect, useState } from 'react'

export interface MediaDeviceLists {
  audioInputs: MediaDeviceInfo[]
  videoInputs: MediaDeviceInfo[]
  audioOutputs: MediaDeviceInfo[]
}

export function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceLists>({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  })

  const refresh = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      setDevices({
        audioInputs: all.filter((d) => d.kind === 'audioinput'),
        videoInputs: all.filter((d) => d.kind === 'videoinput'),
        audioOutputs: all.filter((d) => d.kind === 'audiooutput'),
      })
    } catch {
      /* permission not granted yet */
    }
  }, [])

  useEffect(() => {
    void refresh()
    navigator.mediaDevices.addEventListener('devicechange', refresh)
    return () => navigator.mediaDevices.removeEventListener('devicechange', refresh)
  }, [refresh])

  return { ...devices, refresh }
}

export function buildMediaConstraints(
  audioDeviceId?: string,
  videoDeviceId?: string,
  facingMode?: 'user' | 'environment',
): MediaStreamConstraints {
  let video: boolean | MediaTrackConstraints = true
  if (videoDeviceId) {
    video = { deviceId: { exact: videoDeviceId } }
  } else if (facingMode) {
    video = { facingMode: { ideal: facingMode } }
  }

  return {
    audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
    video,
  }
}
