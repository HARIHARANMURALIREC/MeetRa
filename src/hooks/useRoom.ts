import { useCallback, useState } from 'react'
import { fetchLiveKitToken, resolveLiveKitWsUrl } from '../lib/livekit'

export function useRoom() {
  const [token, setToken] = useState<string | null>(null)
  const [wsUrl, setWsUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async (roomName: string, participantName: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchLiveKitToken(roomName, participantName)
      setToken(response.token)
      setWsUrl(resolveLiveKitWsUrl(response.wsUrl))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setToken(null)
      setWsUrl(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setToken(null)
    setWsUrl(null)
    setError(null)
  }, [])

  return { token, wsUrl, loading, error, connect, disconnect }
}
