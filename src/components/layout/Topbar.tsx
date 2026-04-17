import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Plus } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuthStore } from '@/stores/authStore'
import { apiPostJson } from '@/utils/api'
import { Button } from '@/components/ui/Button'

function titleFromPath(pathname: string) {
  if (pathname.startsWith('/app/dashboard')) return 'Panel'
  if (pathname.startsWith('/app/clientes')) return 'Clientes'
  if (pathname.startsWith('/app/servicios')) return 'Servicios'
  if (pathname.startsWith('/app/flota')) return 'Flota y Choferes'
  if (pathname.startsWith('/app/facturacion')) return 'Facturación'
  if (pathname.startsWith('/app/configuracion')) return 'Configuración'
  return 'App'
}

export function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const clearSession = useAuthStore(s => s.clearSession)

  const title = titleFromPath(location.pathname)

  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <div className="min-w-0">
          <div className="text-xs text-zinc-600 dark:text-zinc-400">Administración de grúas</div>
          <div className="truncate text-base font-semibold tracking-tight">{title}</div>
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
