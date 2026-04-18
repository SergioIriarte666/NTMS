import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'

export type Role = 'admin' | 'operaciones' | 'facturacion' | 'consulta'

export type AuthedUser = {
  id: string
  email: string
  full_name: string
  role: Role
  is_active: boolean
}

type PersistedAuth = {
  token: string
  refresh_token: string
  user: AuthedUser
}

type AuthState = {
  hydrated: boolean
  token: string | null
  refresh_token: string | null
  user: AuthedUser | null
  setSession: (token: string, refresh_token: string, user: AuthedUser) => void
  setUser: (user: AuthedUser) => void
  clearSession: () => void
  hydrate: () => void
}

const storageKey = 'demo_auth'

function safeParse(json: string): PersistedAuth | null {
  try {
    return JSON.parse(json) as PersistedAuth
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  token: null,
  refresh_token: null,
  user: null,
  setSession: (token, refresh_token, user) => {
    localStorage.setItem(storageKey, JSON.stringify({ token, refresh_token, user }))
    set({ token, refresh_token, user })
    void supabase.auth.setSession({ access_token: token, refresh_token })
  },
  setUser: user => {
    const state = get()
    if (!state.token || !state.refresh_token) return
    localStorage.setItem(storageKey, JSON.stringify({ token: state.token, refresh_token: state.refresh_token, user }))
    set({ user })
  },
  clearSession: () => {
    localStorage.removeItem(storageKey)
    set({ token: null, refresh_token: null, user: null })
  },
  hydrate: () => {
    if (get().hydrated) return
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? safeParse(raw) : null
    set({
      hydrated: true,
      token: parsed?.token ?? null,
      refresh_token: parsed?.refresh_token ?? null,
      user: parsed?.user ?? null,
    })
    if (parsed?.token && parsed.refresh_token) {
      void supabase.auth.setSession({ access_token: parsed.token, refresh_token: parsed.refresh_token })
    }
  },
}))
