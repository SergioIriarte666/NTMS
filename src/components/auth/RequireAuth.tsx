import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { apiGetJson } from '@/utils/api'
import { supabase } from '@/lib/supabaseClient'

export function RequireAuth() {
  const location = useLocation()
  const hydrated = useAuthStore(s => s.hydrated)
  const token = useAuthStore(s => s.token)
  const refresh_token = useAuthStore(s => s.refresh_token)
  const setUser = useAuthStore(s => s.setUser)
  const clearSession = useAuthStore(s => s.clearSession)
  const hydrate = useAuthStore(s => s.hydrate)
  const [checking, setChecking] = useState(false)
  const [valid, setValid] = useState<boolean | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hydrated) return
    if (!token) {
      setValid(false)
      return
    }

    let cancelled = false
    setChecking(true)
    setValid(null)

    void (async () => {
      try {
        if (refresh_token) {
          await supabase.auth.setSession({ access_token: token, refresh_token })
        }

        const res = await apiGetJson<{
          success: true
          user: { id: string; email: string; full_name: string; role: 'admin' | 'operaciones' | 'facturacion' | 'consulta'; is_active: boolean }
        }>('/api/auth/me')

        if (cancelled) return
        setUser(res.user)
        setValid(true)
      } catch {
        if (cancelled) return
        clearSession()
        setValid(false)
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [hydrated, token, refresh_token, clearSession, setUser])

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="h-9 w-40 animate-pulse rounded-md bg-black/10 dark:bg-white/10" />
          <div className="mt-6 h-32 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (checking || valid !== true) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="h-9 w-40 animate-pulse rounded-md bg-black/10 dark:bg-white/10" />
          <div className="mt-6 h-32 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
        </div>
      </div>
    )
  }

  return <Outlet />
}
