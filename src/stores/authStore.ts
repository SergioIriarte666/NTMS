import { create } from 'zustand'

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
  user: AuthedUser
}

type AuthState = {
  hydrated: boolean
  token: string | null
  user: AuthedUser | null
  setSession: (token: string, user: AuthedUser) => void
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
  user: null,
  setSession: (token, user) => {
    localStorage.setItem(storageKey, JSON.stringify({ token, user }))
    set({ token, user })
  },
  clearSession: () => {
    localStorage.removeItem(storageKey)
    set({ token: null, user: null })
  },
  hydrate: () => {
    if (get().hydrated) return
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? safeParse(raw) : null
    set({
      hydrated: true,
      token: parsed?.token ?? null,
      user: parsed?.user ?? null,
    })
  },
}))

