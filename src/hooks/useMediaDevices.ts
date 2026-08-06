import { useEffect, useState } from 'react'

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

  useEffect(() => {
    async function load() {
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
    }

    void load()
    navigator.mediaDevices.addEventListener('devicechange', load)
    return () => navigator.mediaDevices.removeEventListener('devicechange', load)
  }, [])

  return devices
}

export function buildMediaConstraints(audioDeviceId?: string, videoDeviceId?: string): MediaStreamConstraints {
  return {
    audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
    video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
  }
}
