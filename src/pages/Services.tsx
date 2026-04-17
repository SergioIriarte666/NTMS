import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { apiGetData, apiPatchData, apiPostData } from '@/utils/api'
import type { Client, Service, Vehicle, Driver, ServiceStatus } from '@/types/domain'
import { useAuthStore } from '@/stores/authStore'

const schema = z.object({
  client_id: z.string().min(1, 'Cliente requerido'),
  service_date: z.string().min(10, 'Fecha requerida'),
  start_time: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  service_type: z.string().optional(),
  status: z.enum(['pendiente', 'asignado', 'en_curso', 'completado', 'cancelado']),
  vehicle_id: z.string().optional().or(z.literal('')),
  driver_id: z.string().optional().or(z.literal('')),
  agreed_amount: z
    .string()
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function statusBadge(status: ServiceStatus) {
  if (status === 'pendiente') return <Badge variant="warning">Pendiente</Badge>
  if (status === 'asignado') return <Badge>Asignado</Badge>
  if (status === 'en_curso') return <Badge>En curso</Badge>
  if (status === 'completado') return <Badge variant="success">Completado</Badge>
  return <Badge variant="danger">Cancelado</Badge>
}

function canEdit(role: string | undefined) {
  return role === 'admin' || role === 'operaciones'
}

export default function Services() {
  const role = useAuthStore(s => s.user?.role)
  const editable = canEdit(role)

  const [services, setServices] = useState<Service[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: '',
      service_date: new Date().toISOString().slice(0, 10),
      start_time: '',
      origin: '',
      destination: '',
      service_type: '',
      status: 'pendiente',
      vehicle_id: '',
      driver_id: '',
      agreed_amount: '',
      notes: '',
    },
  })

  const load = async () => {
    setLoading(true)
    try {
      const [s, c, v, d] = await Promise.all([
        apiGetData<Service[]>('/api/services'),
        apiGetData<Client[]>('/api/clients'),
        apiGetData<Vehicle[]>('/api/fleet/vehicles'),
        apiGetData<Driver[]>('/api/fleet/drivers'),
      ])
      setServices(s)
      setClients(c)
      setVehicles(v)
      setDrivers(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients])
  const vehicleMap = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles])
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.id, d])), [drivers])

  const filtered = useMemo(() => {
    let data = services
    if (statusFilter !== 'all') data = data.filter(s => s.status === statusFilter)
    if (dateFilter) data = data.filter(s => s.service_date === dateFilter)
    return [...data].sort((a, b) => (a.service_date < b.service_date ? 1 : -1))
  }, [services, statusFilter, dateFilter])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Servicios (OT)</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Creación, asignación, estados y cierre.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <Select
                value={statusFilter}
                onChange={e => {
                  const v = e.target.value
                  const allowed = new Set<ServiceStatus | 'all'>([
                    'all',
                    'pendiente',
                    'asignado',
                    'en_curso',
                    'completado',
                    'cancelado',
                  ])
                  if (allowed.has(v as ServiceStatus | 'all')) setStatusFilter(v as ServiceStatus | 'all')
                }}
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="asignado">Asignado</option>
                <option value="en_curso">En curso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </Select>
            </div>
            <div className="w-44">
              <Input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              disabled={!editable}
              onClick={() => {
                setEditing(null)
                reset({
                  client_id: clients[0]?.id ?? '',
                  service_date: new Date().toISOString().slice(0, 10),
                  start_time: '',
                  origin: '',
                  destination: '',
                  service_type: '',
                  status: 'pendiente',
                  vehicle_id: '',
                  driver_id: '',
                  agreed_amount: '',
                  notes: '',
                })
                setOpen(true)
              }}
            >
              Nuevo
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Fecha/Hora</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Origen → Destino</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Grúa</th>
                <th className="px-3 py-2">Chofer</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr
                  key={s.id}
                  className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                >
                  <td className="px-3 py-2 font-medium">
                    {s.service_date}
                    {s.start_time ? <span className="text-zinc-500"> · {s.start_time}</span> : null}
                  </td>
                  <td className="px-3 py-2">{clientMap.get(s.client_id)?.razon_social ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className="text-zinc-700 dark:text-zinc-200">{s.origin || '—'}</span>
                    <span className="mx-1 text-zinc-400">→</span>
                    <span className="text-zinc-700 dark:text-zinc-200">{s.destination || '—'}</span>
                  </td>
                  <td className="px-3 py-2">{statusBadge(s.status)}</td>
                  <td className="px-3 py-2">{s.vehicle_id ? vehicleMap.get(s.vehicle_id)?.patente ?? '—' : '—'}</td>
                  <td className="px-3 py-2">{s.driver_id ? driverMap.get(s.driver_id)?.nombre ?? '—' : '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditing(s)
                        reset({
                          client_id: s.client_id,
                          service_date: s.service_date,
                          start_time: s.start_time ?? '',
                          origin: s.origin ?? '',
                          destination: s.destination ?? '',
                          service_type: s.service_type ?? '',
                          status: s.status,
                          vehicle_id: s.vehicle_id ?? '',
                          driver_id: s.driver_id ?? '',
                          agreed_amount: s.agreed_amount != null ? String(s.agreed_amount) : '',
                          notes: s.notes ?? '',
                        })
                        setOpen(true)
                      }}
                    >
                      Ver / editar
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={7}>
                    Sin servicios.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={7}>
                    Cargando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        title={editing ? 'Editar servicio' : 'Nuevo servicio'}
        description={editable ? 'Completa la orden de trabajo.' : 'Tu rol es solo lectura.'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!editable || isSubmitting}
              onClick={handleSubmit(async values => {
                if (!editable) return
                const payload = {
                  ...values,
                  vehicle_id: values.vehicle_id || undefined,
                  driver_id: values.driver_id || undefined,
                  agreed_amount: values.agreed_amount ? Number(values.agreed_amount) : undefined,
                }
                if (editing) {
                  await apiPatchData<Service>(`/api/services/${editing.id}`, payload)
                } else {
                  await apiPostData<Service>('/api/services', payload)
                }
                setOpen(false)
                await load()
              })}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Cliente</label>
            <div className="mt-1">
              <Select disabled={!editable} {...register('client_id')} error={errors.client_id?.message}>
                <option value="">Selecciona…</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Fecha</label>
            <div className="mt-1">
              <Input type="date" disabled={!editable} {...register('service_date')} error={errors.service_date?.message} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Hora</label>
            <div className="mt-1">
              <Input type="time" disabled={!editable} {...register('start_time')} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tipo de servicio</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('service_type')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Estado</label>
            <div className="mt-1">
              <Select disabled={!editable} {...register('status')} error={errors.status?.message}>
                <option value="pendiente">Pendiente</option>
                <option value="asignado">Asignado</option>
                <option value="en_curso">En curso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Origen</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('origin')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Destino</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('destination')} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Grúa</label>
            <div className="mt-1">
              <Select disabled={!editable} {...register('vehicle_id')}>
                <option value="">Sin asignar</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.patente} ({v.status})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Chofer</label>
            <div className="mt-1">
              <Select disabled={!editable} {...register('driver_id')}>
                <option value="">Sin asignar</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.status})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Monto acordado</label>
            <div className="mt-1">
              <Input
                inputMode="numeric"
                disabled={!editable}
                {...register('agreed_amount')}
                error={errors.agreed_amount?.message}
                placeholder="Ej: 65000"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Notas</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('notes')} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
