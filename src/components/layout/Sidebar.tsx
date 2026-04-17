import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Truck,
  Receipt,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { AnimatedTowTruckLogo } from '@/components/media/AnimatedTowTruckLogo'

const items = [
  { to: '/app/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/app/clientes', label: 'Clientes', icon: Users },
  { to: '/app/servicios', label: 'Servicios', icon: ClipboardList },
  { to: '/app/flota', label: 'Flota', icon: Truck },
  { to: '/app/facturacion', label: 'Facturación', icon: Receipt },
  { to: '/app/configuracion', label: 'Configuración', icon: Settings },
]

export function Sidebar() {
  const user = useAuthStore(s => s.user)
  return (
    <aside className="hidden w-64 shrink-0 border-r border-black/10 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-zinc-950/60 md:block">
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
          <AnimatedTowTruckLogo className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">Administración</div>
          <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
            Empresa de grúas
          </div>
        </div>
      </div>

      <nav className="px-2 py-3">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-zinc-100',
                isActive &&
                  'bg-black/5 text-zinc-900 dark:bg-white/10 dark:text-zinc-100',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-black/10 px-4 py-3 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-400">
        <div className="truncate">{user?.full_name ?? 'Usuario'}</div>
        <div className="truncate">Rol: {user?.role ?? '-'}</div>
      </div>
    </aside>
  )
}

