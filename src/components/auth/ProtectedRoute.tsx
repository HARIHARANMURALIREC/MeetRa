import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { useMeetingStore } from '../../store/useMeetingStore'
import { fetchProfile, profileToDisplay } from '../../lib/profile'

interface ProtectedRouteProps {
  children: ReactNode
}

async function hydrateUser(sessionUser: { id: string; email?: string; user_metadata?: Record<string, string> }) {
  const profile = await fetchProfile(sessionUser.id)
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    displayName: profileToDisplay(profile, sessionUser.email),
    avatarUrl: profile?.avatar_url,
  }
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const setUser = useMeetingStore((s) => s.setUser)
  const setDisplayName = useMeetingStore((s) => s.setDisplayName)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return

      if (data.session?.user) {
        const user = await hydrateUser(data.session.user)
        setUser(user)
        setDisplayName(user.displayName)
        setAuthenticated(true)
      } else {
        setUser(null)
        setAuthenticated(false)
      }
      setLoading(false)
    }

    void checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await hydrateUser(session.user)
        setUser(user)
        setDisplayName(user.displayName)
        setAuthenticated(true)
      } else {
        setUser(null)
        setAuthenticated(false)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [setUser, setDisplayName])

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
