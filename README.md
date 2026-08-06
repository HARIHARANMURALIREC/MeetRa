# Meetra

Google Meet-style video conferencing — instant rooms, WebRTC via LiveKit, auth + chat via Supabase.

## Stack

- React 18 + TypeScript + Vite + Tailwind CSS
- LiveKit Cloud (WebRTC SFU)
- Supabase (Auth, Postgres, Realtime, Edge Functions)
- Zustand for client state

## Quick start

```bash
npm install
cp .env.example .env   # or use the pre-filled .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Supabase project

- **Project ref**: `nzrxeogmkxdhmyoxylnk`
- **URL**: https://nzrxeogmkxdhmyoxylnk.supabase.co

### Before first run

1. Enable **Google OAuth** in Supabase Dashboard (see [LIVEKIT_SETUP.md](./LIVEKIT_SETUP.md))
2. For video calls, complete LiveKit setup in [LIVEKIT_SETUP.md](./LIVEKIT_SETUP.md)

## Features

- Create/join meetings by shareable code
- Pre-join camera/mic preview
- Waiting room with host approve/deny
- LiveKit video grid with active speaker highlight
- Screen share, in-call chat (Supabase Realtime)
- Connection quality indicators
- Copy invite link, leave/rejoin flow

## Project structure

```
src/
  components/
    room/       VideoGrid, ParticipantTile, Controls, ChatPanel
    lobby/      PreJoin, WaitingRoom, PendingParticipants
    auth/       ProtectedRoute
  hooks/        useRoom, useChat, useSpeakerDetection, useNoiseSuppression
  lib/          supabase, livekit, roomCode
  pages/        Home, Room, Login
  store/        useMeetingStore
supabase/
  migrations/   Database schema + RLS
  functions/    generate-livekit-token Edge Function
```

## Build

```bash
npm run build
```

## Deploy

- **Frontend**: Vercel or Cloudflare Pages — set `VITE_*` env vars
- **Backend**: Supabase (already hosted)
- **Media**: LiveKit Cloud
