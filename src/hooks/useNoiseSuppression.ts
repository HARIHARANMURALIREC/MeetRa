import { useEffect, useRef, useState } from 'react'
import type { LocalAudioTrack } from 'livekit-client'

/**
 * Client-side noise suppression using Web Audio API dynamics processing.
 * RNNoise WASM can be swapped in when @shiguredo/rnnoise-wasm is added.
 * This provides a lightweight fallback that reduces background noise levels.
 */
export function useNoiseSuppression(track: LocalAudioTrack | undefined, enabled = true) {
  const pipelineRef = useRef<{
    ctx: AudioContext
    source: MediaStreamAudioSourceNode
    compressor: DynamicsCompressorNode
    destination: MediaStreamAudioDestinationNode
  } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!track?.mediaStreamTrack || !enabled) {
      setReady(false)
      return
    }

    let mounted = true

    async function setup() {
      try {
        const ctx = new AudioContext()
        const source = ctx.createMediaStreamSource(new MediaStream([track!.mediaStreamTrack]))
        const compressor = ctx.createDynamicsCompressor()
        compressor.threshold.value = -24
        compressor.knee.value = 30
        compressor.ratio.value = 12
        compressor.attack.value = 0.003
        compressor.release.value = 0.25

        const destination = ctx.createMediaStreamDestination()
        source.connect(compressor)
        compressor.connect(destination)

        if (!mounted) {
          await ctx.close()
          return
        }

        pipelineRef.current = { ctx, source, compressor, destination }
        setReady(true)
      } catch {
        setReady(false)
      }
    }

    setup()

    return () => {
      mounted = false
      pipelineRef.current?.source.disconnect()
      pipelineRef.current?.compressor.disconnect()
      void pipelineRef.current?.ctx.close()
      pipelineRef.current = null
      setReady(false)
    }
  }, [track, enabled])

  return { ready, processedStream: pipelineRef.current?.destination.stream }
}
