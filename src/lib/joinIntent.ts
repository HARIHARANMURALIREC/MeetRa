const JOIN_INTENT_KEY = 'meetra-join-intent'

export function setJoinIntent(code: string) {
  sessionStorage.setItem(JOIN_INTENT_KEY, code)
}

export function getJoinIntent(): string | null {
  return sessionStorage.getItem(JOIN_INTENT_KEY)
}

export function clearJoinIntent() {
  sessionStorage.removeItem(JOIN_INTENT_KEY)
}

export function buildAuthRedirectUrl(path: '/dashboard' | '/login' | '/register', join?: string | null) {
  const url = new URL(path, window.location.origin)
  if (join) url.searchParams.set('join', join)
  return url.toString()
}

export function readJoinParam(searchParams: URLSearchParams): string | null {
  const join = searchParams.get('join')
  return join?.trim() || null
}
