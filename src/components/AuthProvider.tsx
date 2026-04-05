'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createBrowserClient } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => void
  signOut: () => Promise<void>
  showLoginModal: boolean
  setShowLoginModal: (show: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: () => {},
  signOut: async () => {},
  showLoginModal: false,
  setShowLoginModal: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createBrowserClient())
  const [showLoginModal, setShowLoginModal] = useState(false)
  const router = useRouter()

  // Handle auth callback from URL fragment
  const handleAuthCallback = useCallback(async () => {
    const hash = window.location.hash
    if (!hash || !hash.includes('type=auth_callback')) return

    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) {
        console.error('Failed to set session:', error.message)
      } else {
        // Refresh server components to reflect logged-in state
        router.refresh()
      }
    }

    // Clean up URL fragment
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [supabase])

  useEffect(() => {
    // First handle any auth callback, then get session
    handleAuthCallback().then(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase, handleAuthCallback])

  function signInWithGoogle() {
    const redirectTo = window.location.pathname + window.location.search
    window.location.href = `/api/auth/google?redirectTo=${encodeURIComponent(redirectTo)}`
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, showLoginModal, setShowLoginModal }}>
      {children}
    </AuthContext.Provider>
  )
}
