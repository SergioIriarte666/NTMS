import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { apiGetData } from '@/utils/api'
import type { Invoice, Service, Vehicle, Driver } from '@/types/domain'

function statusBadge(status: Service['status']) {
  if (status === 'pendiente') return <Badge variant="warning">Pendiente</Badge>
  if (status === 'asignado') return <Badge>Asignado</Badge>
  if (status === 'en_curso') return <Badge>En curso</Badge>
  if (status === 'completado') return <Badge variant="success">Completado</Badge>
  return <Badge variant="danger">Cancelado</Badge>
}

export default function Dashboard() {
  const [services, setServices] = useState<Service[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      apiGetData<Service[]>('/api/services'),
      apiGetData<Invoice[]>('/api/invoices'),
      apiGetData<Vehicle[]>('/api/fleet/vehicles'),
      apiGetData<Driver[]>('/api/fleet/drivers'),
    ])
      .then(([s, i, v, d]) => {
        if (!active) return
        setServices(s)
        setInvoices(i)
        setVehicles(v)
        setDrivers(d)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const kpis = useMemo(() => {
    const servicesToday = services.filter(s => s.service_date === today).length
    const pendingAssign = services.filter(
      s =>
        (s.status === 'pendiente' || (!s.vehicle_id || !s.driver_id)) &&
        s.status !== 'cancelado',
    ).length
    const invoicesOpen = invoices.filter(i => i.status === 'emitida' || i.status === 'vencida').length
    const fleetAvailable = vehicles.filter(v => v.status === 'disponible' && v.is_active).length
    const driversAvailable = drivers.filter(d => d.status === 'disponible' && d.is_active).length
    return {
      servicesToday,
      pendingAssign,
      invoicesOpen,
      fleetAvailable,
      driversAvailable,
    }
  }, [services, invoices, vehicles, drivers, today])

  const recentServices = useMemo(() => {
    return [...services]
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
      .slice(0, 8)
  }, [services])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Servicios hoy</div>
          <div className="mt-2 text-3xl font-semibold">{loading ? '—' : kpis.servicesToday}</div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Pendientes de asignación</div>
          <div className="mt-2 text-3xl font-semibold">{loading ? '—' : kpis.pendingAssign}</div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Facturas por cobrar</div>
          <div className="mt-2 text-3xl font-semibold">{loading ? '—' : kpis.invoicesOpen}</div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Disponibilidad</div>
          <div className="mt-2 text-sm">
            <span className="font-semibold">{loading ? '—' : kpis.fleetAvailable}</span> grúas ·{' '}
            <span className="font-semibold">{loading ? '—' : kpis.driversAvailable}</span> choferes
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-base font-semibold">Servicios recientes</div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Últimas actualizaciones operativas.
              </div>
            </div>
            <Link to="/app/servicios">
              <Button>Ver todos</Button>
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Origen → Destino</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {recentServices.map(s => (
                  <tr
                    key={s.id}
                    className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                  >
                    <td className="px-3 py-2 font-medium">{s.service_date}</td>
                    <td className="px-3 py-2">
                      <span className="text-zinc-700 dark:text-zinc-200">{s.origin || '—'}</span>
                      <span className="mx-1 text-zinc-400">→</span>
                      <span className="text-zinc-700 dark:text-zinc-200">{s.destination || '—'}</span>
                    </td>
                    <td className="px-3 py-2">{statusBadge(s.status)}</td>
                    <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-200">
                      {s.agreed_amount ? `$${s.agreed_amount.toLocaleString('es-CL')}` : '—'}
                    </td>
                  </tr>
                ))}
                {!loading && recentServices.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={4}>
                      No hay servicios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="text-base font-semibold">Accesos rápidos</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Operación diaria.
          </div>
          <div className="mt-4 grid gap-2">
            <Link to="/app/servicios">
              <Button className="w-full" variant="primary">
                Crear servicio
              </Button>
            </Link>
            <Link to="/app/clientes">
              <Button className="w-full">Crear / buscar cliente</Button>
            </Link>
            <Link to="/app/facturacion">
              <Button className="w-full">Ir a facturación</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

