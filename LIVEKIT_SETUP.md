# LiveKit Cloud Setup for Meetra

Complete these steps before video calls will work. The app is built to run without LiveKit for lobby/auth/chat testing until keys are added.

## 1. Create a LiveKit Cloud account

1. Go to [https://cloud.livekit.io/](https://cloud.livekit.io/)
2. Sign up with Google or GitHub (Build tier — **$0/mo**, no credit card)
3. Create a project named **Meetra**
4. Pick a region close to your users (e.g. India if available)

## 2. Copy credentials

From the LiveKit dashboard:

| Credential | Where to find | Env variable |
|---|---|---|
| WebSocket URL | Top of project dashboard | `VITE_LIVEKIT_WS_URL` |
| API Key | Settings → Keys | `LIVEKIT_API_KEY` |
| API Secret | Settings → Keys | `LIVEKIT_API_SECRET` |

Example WebSocket URL: `wss://meetra-xxxxx.livekit.cloud`

## 3. Configure local `.env`

```bash
VITE_LIVEKIT_WS_URL=wss://your-project.livekit.cloud
```

## 4. Set Edge Function secrets

The token server needs LiveKit credentials server-side (never expose the secret to the browser):

```bash
# Install Supabase CLI first: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref nzrxeogmkxdhmyoxylnk

supabase secrets set LIVEKIT_API_KEY=your_api_key
supabase secrets set LIVEKIT_API_SECRET=your_api_secret
supabase secrets set LIVEKIT_WS_URL=wss://your-project.livekit.cloud

supabase functions deploy generate-livekit-token
```

## 5. Test the token endpoint

After signing in to the app, get your session JWT from browser devtools, then:

```bash
curl -X POST \
  'https://nzrxeogmkxdhmyoxylnk.supabase.co/functions/v1/generate-livekit-token' \
  -H 'Authorization: Bearer YOUR_SUPABASE_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"roomName":"abc-defg-hij","participantName":"Test User"}'
```

Expected response: `{ "token": "...", "wsUrl": "wss://..." }`

## 6. Enable Google OAuth (Supabase)

1. Supabase Dashboard → Authentication → Providers → **Google** → Enable
2. Google Cloud Console → Create OAuth 2.0 Client ID
3. Authorized redirect URI: `https://nzrxeogmkxdhmyoxylnk.supabase.co/auth/v1/callback`
4. Supabase → Authentication → URL Configuration:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`

## Free tier limits

LiveKit Build plan includes **5,000 WebRTC participant minutes/month** — enough for development and small demos.
