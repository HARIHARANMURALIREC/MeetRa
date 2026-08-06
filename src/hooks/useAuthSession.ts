import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useMeetingStore } from '../store/useMeetingStore'
import { fetchProfile, profileToDisplay } from '../lib/profile'

/** Hydrates session into the meeting store for public pages. */
export function useAuthSession() {
  const setUser = useMeetingStore((s) => s.setUser)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    async function hydrate(sessionUser: { id: string; email?: string; user_metadata?: Record<string, string> }) {
      const profile = await fetchProfile(sessionUser.id)
      setUser({
        id: sessionUser.id,
        email: sessionUser.email,
        displayName: profileToDisplay(profile, sessionUser.email),
        avatarUrl: profile?.avatar_url,
      })
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      const sessionUser = data.session?.user
      if (sessionUser) {
        await hydrate(sessionUser)
      } else {
        setUser(null)
      }
      setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await hydrate(session.user)
      } else {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [setUser])

  return ready
}
