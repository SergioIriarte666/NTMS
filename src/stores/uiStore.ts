import { create } from 'zustand'

type PersistedUi = {
  sidebarCollapsed: boolean
}

type UiState = {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

const storageKey = 'demo_ui'

function safeParse(json: string): PersistedUi | null {
  try {
    return JSON.parse(json) as PersistedUi
  } catch {
    return null
  }
}

function readInitial(): boolean {
  try {
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? safeParse(raw) : null
    return parsed?.sidebarCollapsed ?? false
  } catch {
    return false
  }
}

function persist(sidebarCollapsed: boolean) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ sidebarCollapsed }))
  } catch {
    return
  }
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: readInitial(),
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed
    persist(next)
    set({ sidebarCollapsed: next })
  },
  setSidebarCollapsed: collapsed => {
    persist(collapsed)
    set({ sidebarCollapsed: collapsed })
  },
}))
