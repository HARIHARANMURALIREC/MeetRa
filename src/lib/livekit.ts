import { supabase } from './supabase'

export interface LiveKitTokenResponse {
  token: string
  wsUrl: string
}

export async function fetchLiveKitToken(
  roomName: string,
  participantName: string,
): Promise<LiveKitTokenResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-livekit-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomName, participantName }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch token' }))
    throw new Error(error.error ?? 'Failed to fetch LiveKit token')
  }

  return response.json()
}

export function getLiveKitWsUrl(): string {
  const wsUrl = import.meta.env.VITE_LIVEKIT_WS_URL?.trim()
  if (!wsUrl) {
    throw new Error('VITE_LIVEKIT_WS_URL is not configured in .env')
  }
  if (!/^wss:\/\/[a-z0-9.-]+\.livekit\.cloud\/?$/i.test(wsUrl)) {
    throw new Error(
      `VITE_LIVEKIT_WS_URL looks invalid: "${wsUrl}". Use your LiveKit Cloud URL, e.g. wss://your-project.livekit.cloud`,
    )
  }
  return wsUrl
}

/** Prefer client env — browser connects here; ignore bad/placeholder server values. */
export function resolveLiveKitWsUrl(serverUrl?: string): string {
  const clientUrl = getLiveKitWsUrl()
  if (!serverUrl?.trim()) return clientUrl

  const trimmed = serverUrl.trim()
  const valid =
    trimmed.startsWith('wss://') &&
    trimmed.includes('.livekit.cloud') &&
    !trimmed.includes('your-project') &&
    !trimmed.includes('...')

  return valid ? trimmed : clientUrl
}
