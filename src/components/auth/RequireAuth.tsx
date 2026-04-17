import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function RequireAuth() {
  const location = useLocation()
  const hydrated = useAuthStore(s => s.hydrated)
  const token = useAuthStore(s => s.token)
  const hydrate = useAuthStore(s => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

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

  return <Outlet />
}

