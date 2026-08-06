import { createClient } from 'npm:@supabase/supabase-js@2.49.1'
import { RoomServiceClient, TrackSource, TrackType } from 'npm:livekit-server-sdk@2.9.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function createLiveKitHost(wsUrl: string, apiKey: string, apiSecret: string) {
  return new RoomServiceClient(wsUrl.replace('wss://', 'https://'), apiKey, apiSecret)
}

function audioTrackSids(tracks: Array<{ sid?: string; type?: TrackType; source?: TrackSource }>) {
  return tracks
    .filter((track) => track.type === TrackType.AUDIO || track.source === TrackSource.MICROPHONE)
    .map((track) => track.sid)
    .filter((sid): sid is string => Boolean(sid))
}

async function muteParticipantTracks(
  host: RoomServiceClient,
  roomCode: string,
  participantIdentity: string,
  trackSids?: string[],
) {
  let sids = trackSids?.filter(Boolean) ?? []

  if (sids.length === 0) {
    const target = await host.getParticipant(roomCode, participantIdentity)
    sids = audioTrackSids(target.tracks)
  }

  await Promise.all(
    sids.map((trackSid) => host.mutePublishedTrack(roomCode, participantIdentity, trackSid, true)),
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const livekitApiKey = Deno.env.get('LIVEKIT_API_KEY')
    const livekitApiSecret = Deno.env.get('LIVEKIT_API_SECRET')
    const livekitWsUrl = Deno.env.get('LIVEKIT_WS_URL')

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const body = await req.json()
    const action = body.action as 'mute' | 'remove' | 'end'
    const roomId = body.roomId as string
    const participantIdentity = body.participantIdentity as string | undefined
    const trackSids = body.trackSids as string[] | undefined

    if (!action || !roomId) {
      return jsonResponse({ error: 'action and roomId required' }, 400)
    }

    const [{ data: userData, error: userError }, { data: room, error: roomError }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('rooms').select('id, room_code, host_id').eq('id', roomId).single(),
    ])

    if (userError || !userData.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    if (roomError || !room || room.host_id !== userData.user.id) {
      return jsonResponse({ error: 'Only the host can perform this action' }, 403)
    }

    const host =
      livekitApiKey && livekitApiSecret && livekitWsUrl
        ? createLiveKitHost(livekitWsUrl, livekitApiKey, livekitApiSecret)
        : null

    if (action === 'end') {
      const tasks: Promise<unknown>[] = [
        supabase
          .from('rooms')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('id', roomId),
      ]

      if (host) {
        tasks.push(
          host.deleteRoom(room.room_code).catch(() => {
            /* room may already be empty */
          }),
        )
      }

      await Promise.all(tasks)
      return jsonResponse({ ok: true })
    }

    if (!participantIdentity) {
      return jsonResponse({ error: 'participantIdentity required' }, 400)
    }

    if (action === 'remove') {
      const tasks: Promise<unknown>[] = [
        supabase
          .from('participants')
          .update({ left_at: new Date().toISOString() })
          .eq('room_id', roomId)
          .eq('user_id', participantIdentity)
          .is('left_at', null),
      ]

      if (host) {
        tasks.push(
          host.removeParticipant(room.room_code, participantIdentity).catch(() => {
            /* participant may have left */
          }),
        )
      }

      await Promise.all(tasks)
      return jsonResponse({ ok: true })
    }

    if (action === 'mute') {
      if (!host) {
        return jsonResponse({ error: 'LiveKit not configured' }, 503)
      }

      await muteParticipantTracks(host, room.room_code, participantIdentity, trackSids)
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'Unknown action' }, 400)
  } catch (err) {
    console.error('room-admin error:', err)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
