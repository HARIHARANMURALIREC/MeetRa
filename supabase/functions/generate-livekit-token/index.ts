import { createClient } from 'npm:@supabase/supabase-js@2.49.1'
import { SignJWT } from 'npm:jose@5.9.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function createLiveKitToken(opts: {
  apiKey: string
  apiSecret: string
  identity: string
  name: string
  room: string
}): Promise<string> {
  const secret = new TextEncoder().encode(opts.apiSecret)
  return new SignJWT({
    video: {
      roomJoin: true,
      room: opts.room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
    name: opts.name,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(opts.apiKey)
    .setSubject(opts.identity)
    .setIssuedAt()
    .setNotBefore('0s')
    .setExpirationTime('6h')
    .sign(secret)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const livekitApiKey = Deno.env.get('LIVEKIT_API_KEY')?.trim()
    const livekitApiSecret = Deno.env.get('LIVEKIT_API_SECRET')?.trim()
    const livekitWsUrl = Deno.env.get('LIVEKIT_WS_URL')?.trim()

    const placeholderPattern = /^\.{2,}$|^your_|^xxx$/i
    const invalidCredentials =
      !livekitApiKey ||
      !livekitApiSecret ||
      placeholderPattern.test(livekitApiKey) ||
      placeholderPattern.test(livekitApiSecret) ||
      livekitApiKey.length < 8 ||
      livekitApiSecret.length < 16

    if (invalidCredentials) {
      return new Response(
        JSON.stringify({
          error:
            'LiveKit credentials not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Supabase secrets (LiveKit Cloud → Settings → Keys).',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const wsUrl =
      livekitWsUrl &&
      livekitWsUrl.startsWith('wss://') &&
      livekitWsUrl.includes('.livekit.cloud') &&
      !livekitWsUrl.includes('your-project')
        ? livekitWsUrl
        : null

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = userData.user.id
    const body = await req.json()
    const roomName = body.roomName as string
    const participantName = body.participantName as string

    if (!roomName || !participantName) {
      return new Response(JSON.stringify({ error: 'roomName and participantName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, host_id, room_code')
      .eq('room_code', roomName)
      .eq('is_active', true)
      .single()

    if (roomError || !room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isHost = room.host_id === userId

    if (!isHost) {
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('approved, left_at')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .is('left_at', null)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (participantError || !participant?.approved) {
        return new Response(JSON.stringify({ error: 'Not approved to join this room' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const token = await createLiveKitToken({
      apiKey: livekitApiKey,
      apiSecret: livekitApiSecret,
      identity: userId,
      name: participantName,
      room: room.room_code,
    })

    return new Response(
      JSON.stringify({
        token,
        wsUrl: wsUrl ?? '',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('Token generation error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
