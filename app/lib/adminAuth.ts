// Client-side helper for admin session state and tokens

const STORAGE_KEY = 'c2b_admin_session'

export interface AdminSession {
  email: string
  authenticated: boolean
  timestamp: number
}

export function saveAdminSession(email: string): void {
  if (typeof window === 'undefined') return
  const session: AdminSession = {
    email: email.toLowerCase(),
    authenticated: true,
    timestamp: Date.now(),
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    // Also set cookie for server-side verification
    document.cookie = `c2b_admin_session=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=86400; SameSite=Lax`
  } catch (e) {
    console.error('Failed to save admin session', e)
  }
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session: AdminSession = JSON.parse(raw)
    // Check if session is older than 24 hours
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
      clearAdminSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
    document.cookie = 'c2b_admin_session=; path=/; max-age=0'
  } catch (e) {
    console.error('Failed to clear admin session', e)
  }
}
