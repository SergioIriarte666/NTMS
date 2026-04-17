import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { apiGetData, apiPatchData, apiPostData } from '@/utils/api'
import type { Vehicle, Driver, VehicleStatus, DriverStatus } from '@/types/domain'
import { useAuthStore } from '@/stores/authStore'

function canEdit(role: string | undefined) {
  return role === 'admin' || role === 'operaciones'
}

const vehicleSchema = z.object({
  patente: z.string().min(1, 'Patente requerida'),
  tipo: z.string().optional(),
  capacidad: z.string().optional(),
  status: z.enum(['disponible', 'ocupado', 'mantencion', 'inactivo']),
})

type VehicleForm = z.infer<typeof vehicleSchema>

const driverSchema = z.object({
  rut: z.string().optional(),
  nombre: z.string().min(1, 'Nombre requerido'),
  licencia_clase: z.string().optional(),
  telefono: z.string().optional(),
  status: z.enum(['disponible', 'ocupado', 'licencia', 'inactivo']),
})

type DriverForm = z.infer<typeof driverSchema>

function statusBadge(status: VehicleStatus | DriverStatus) {
  if (status === 'disponible') return <Badge variant="success">Disponible</Badge>
  if (status === 'ocupado') return <Badge variant="warning">Ocupado</Badge>
  if (status === 'mantencion') return <Badge variant="danger">Mantención</Badge>
  if (status === 'licencia') return <Badge variant="warning">Licencia</Badge>
  return <Badge>Inactivo</Badge>
}

export default function Fleet() {
  const role = useAuthStore(s => s.user?.role)
  const editable = canEdit(role)

  const [tab, setTab] = useState<'vehicles' | 'drivers'>('vehicles')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  const [openVehicle, setOpenVehicle] = useState(false)
  const [openDriver, setOpenDriver] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)

  const {
    register: registerVehicle,
    handleSubmit: handleVehicleSubmit,
    reset: resetVehicle,
    formState: { errors: vehicleErrors, isSubmitting: isVehicleSubmitting },
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { patente: '', tipo: '', capacidad: '', status: 'disponible' },
  })

  const {
    register: registerDriver,
    handleSubmit: handleDriverSubmit,
    reset: resetDriver,
    formState: { errors: driverErrors, isSubmitting: isDriverSubmitting },
  } = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    defaultValues: { rut: '', nombre: '', licencia_clase: '', telefono: '', status: 'disponible' },
  })

  const load = async () => {
    setLoading(true)
    try {
      const [v, d] = await Promise.all([
        apiGetData<Vehicle[]>('/api/fleet/vehicles'),
        apiGetData<Driver[]>('/api/fleet/drivers'),
      ])
      setVehicles(v)
      setDrivers(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sortedVehicles = useMemo(() => [...vehicles].sort((a, b) => (a.patente < b.patente ? -1 : 1)), [vehicles])
  const sortedDrivers = useMemo(() => [...drivers].sort((a, b) => (a.nombre < b.nombre ? -1 : 1)), [drivers])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Flota y choferes</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Registro y disponibilidad.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={tab === 'vehicles' ? 'primary' : 'secondary'} onClick={() => setTab('vehicles')}>
              Flota
            </Button>
            <Button variant={tab === 'drivers' ? 'primary' : 'secondary'} onClick={() => setTab('drivers')}>
              Choferes
            </Button>
            {tab === 'vehicles' ? (
              <Button
                variant="primary"
                disabled={!editable}
                onClick={() => {
                  setEditingVehicle(null)
                  resetVehicle({ patente: '', tipo: '', capacidad: '', status: 'disponible' })
                  setOpenVehicle(true)
                }}
              >
                Nueva grúa
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={!editable}
                onClick={() => {
                  setEditingDriver(null)
                  resetDriver({ rut: '', nombre: '', licencia_clase: '', telefono: '', status: 'disponible' })
                  setOpenDriver(true)
                }}
              >
                Nuevo chofer
              </Button>
            )}
          </div>
        </div>

        {tab === 'vehicles' ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Patente</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Capacidad</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedVehicles.map(v => (
                  <tr
                    key={v.id}
                    className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                  >
                    <td className="px-3 py-2 font-medium">{v.patente}</td>
                    <td className="px-3 py-2">{v.tipo || '—'}</td>
                    <td className="px-3 py-2">{v.capacidad || '—'}</td>
                    <td className="px-3 py-2">{statusBadge(v.status)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingVehicle(v)
                          resetVehicle({
                            patente: v.patente,
                            tipo: v.tipo || '',
                            capacidad: v.capacidad || '',
                            status: v.status,
                          })
                          setOpenVehicle(true)
                        }}
                      >
                        Ver / editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && sortedVehicles.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={5}>
                      Sin grúas.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={5}>
                      Cargando…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">RUT</th>
                  <th className="px-3 py-2">Licencia</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedDrivers.map(d => (
                  <tr
                    key={d.id}
                    className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                  >
                    <td className="px-3 py-2 font-medium">{d.nombre}</td>
                    <td className="px-3 py-2">{d.rut || '—'}</td>
                    <td className="px-3 py-2">{d.licencia_clase || '—'}</td>
                    <td className="px-3 py-2">{statusBadge(d.status)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingDriver(d)
                          resetDriver({
                            rut: d.rut || '',
                            nombre: d.nombre,
                            licencia_clase: d.licencia_clase || '',
                            telefono: d.telefono || '',
                            status: d.status,
                          })
                          setOpenDriver(true)
                        }}
                      >
                        Ver / editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && sortedDrivers.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={5}>
                      Sin choferes.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={5}>
                      Cargando…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={openVehicle}
        title={editingVehicle ? 'Editar grúa' : 'Nueva grúa'}
        description={editable ? 'Registra la grúa y su disponibilidad.' : 'Tu rol es solo lectura.'}
        onClose={() => setOpenVehicle(false)}
        footer={
          <>
            <Button onClick={() => setOpenVehicle(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!editable || isVehicleSubmitting}
              onClick={handleVehicleSubmit(async values => {
                if (!editable) return
                const payload = { ...values, patente: values.patente.trim().toUpperCase(), is_active: true }
                if (editingVehicle) {
                  await apiPatchData<Vehicle>(`/api/fleet/vehicles/${editingVehicle.id}`, payload)
                } else {
                  await apiPostData<Vehicle>('/api/fleet/vehicles', payload)
                }
                setOpenVehicle(false)
                await load()
              })}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Patente</label>
            <div className="mt-1">
              <Input disabled={!editable} {...registerVehicle('patente')} error={vehicleErrors.patente?.message} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Estado</label>
            <div className="mt-1">
              <Select disabled={!editable} {...registerVehicle('status')} error={vehicleErrors.status?.message}>
                <option value="disponible">Disponible</option>
                <option value="ocupado">Ocupado</option>
                <option value="mantencion">Mantención</option>
                <option value="inactivo">Inactivo</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <div className="mt-1">
              <Input disabled={!editable} {...registerVehicle('tipo')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Capacidad</label>
            <div className="mt-1">
              <Input disabled={!editable} {...registerVehicle('capacidad')} />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={openDriver}
        title={editingDriver ? 'Editar chofer' : 'Nuevo chofer'}
        description={editable ? 'Registra el chofer y su disponibilidad.' : 'Tu rol es solo lectura.'}
        onClose={() => setOpenDriver(false)}
        footer={
          <>
            <Button onClick={() => setOpenDriver(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!editable || isDriverSubmitting}
              onClick={handleDriverSubmit(async values => {
                if (!editable) return
                const payload = { ...values, is_active: true }
                if (editingDriver) {
                  await apiPatchData<Driver>(`/api/fleet/drivers/${editingDriver.id}`, payload)
                } else {
                  await apiPostData<Driver>('/api/fleet/drivers', payload)
                }
                setOpenDriver(false)
                await load()
              })}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <div className="mt-1">
              <Input disabled={!editable} {...registerDriver('nombre')} error={driverErrors.nombre?.message} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">RUT</label>
            <div className="mt-1">
              <Input disabled={!editable} {...registerDriver('rut')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Licencia</label>
            <div className="mt-1">
              <Input disabled={!editable} {...registerDriver('licencia_clase')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Teléfono</label>
            <div className="mt-1">
              <Input disabled={!editable} {...registerDriver('telefono')} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Estado</label>
            <div className="mt-1">
              <Select disabled={!editable} {...registerDriver('status')} error={driverErrors.status?.message}>
                <option value="disponible">Disponible</option>
                <option value="ocupado">Ocupado</option>
                <option value="licencia">Licencia</option>
                <option value="inactivo">Inactivo</option>
              </Select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

