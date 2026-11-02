import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import { readDemoSession, subscribeDemoAuth } from './authService'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readDemoSession)

  useEffect(() => subscribeDemoAuth(() => setSession(readDemoSession())), [])

  const value = useMemo(() => ({
    user: session.user,
    profile: session.profile,
    loading: false,
    error: '',
    setProfile: (profile) => setSession((current) => ({ ...current, profile })),
  }), [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
