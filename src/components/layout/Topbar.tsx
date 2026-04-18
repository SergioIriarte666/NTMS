import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { apiPostJson } from '@/utils/api'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabaseClient'

function titleFromPath(pathname: string) {
  if (pathname.startsWith('/app/dashboard')) return 'Panel'
  if (pathname.startsWith('/app/clientes')) return 'Clientes'
  if (pathname.startsWith('/app/servicios')) return 'Servicios'
  if (pathname.startsWith('/app/flota')) return 'Flota'
  if (pathname.startsWith('/app/operadores')) return 'Operadores'
  if (pathname.startsWith('/app/facturacion')) return 'Facturación'
  if (pathname.startsWith('/app/configuracion')) return 'Configuración'
  return 'App'
}

export function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const clearSession = useAuthStore(s => s.clearSession)
  const token = useAuthStore(s => s.token)
  const refresh_token = useAuthStore(s => s.refresh_token)
  const collapsed = useUiStore(s => s.sidebarCollapsed)
  const toggleSidebar = useUiStore(s => s.toggleSidebar)

  const title = titleFromPath(location.pathname)

  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            className="hidden md:inline-flex"
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            onClick={toggleSidebar}
            leftIcon={collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          >
            <span className="hidden lg:inline">Menú</span>
          </Button>
          <div className="min-w-0">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Administración de grúas</div>
            <div className="truncate text-base font-semibold tracking-tight">{title}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/app/servicios">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              <span className="hidden sm:inline">Crear servicio</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </Link>

          <ThemeToggle />

          <Button
            variant="ghost"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={async () => {
              try {
                if (token && refresh_token) {
                  await supabase.auth.setSession({ access_token: token, refresh_token })
                }
                await supabase.auth.signOut()
                await apiPostJson<{ success: true }>('/api/auth/logout', {})
              } catch (e) {
                void e
              } finally {
                clearSession()
                navigate('/login', { replace: true })
              }
            }}
          >
            <span className="hidden md:inline">Salir</span>
          </Button>
        </div>
      </div>

      {user && (
        <div className="border-t border-black/5 px-6 py-2 text-xs text-zinc-600 dark:border-white/5 dark:text-zinc-400">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{user.full_name}</span>
          <span className="mx-2">·</span>
          <span>Rol: {user.role}</span>
        </div>
      )}
    </header>
  )
}
