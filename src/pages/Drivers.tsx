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
import type { Driver, DriverStatus } from '@/types/domain'
import { useAuthStore } from '@/stores/authStore'

function canEdit(role: string | undefined) {
  return role === 'admin' || role === 'operaciones'
}

const driverSchema = z.object({
  rut: z.string().optional(),
  nombre: z.string().min(1, 'Nombre requerido'),
  licencia_clase: z.string().optional(),
  telefono: z.string().optional(),
  status: z.enum(['disponible', 'ocupado', 'licencia', 'inactivo']),
})

type DriverForm = z.infer<typeof driverSchema>

function statusBadge(status: DriverStatus) {
  if (status === 'disponible') return <Badge variant="success">Disponible</Badge>
  if (status === 'ocupado') return <Badge variant="warning">Ocupado</Badge>
  if (status === 'licencia') return <Badge variant="warning">Licencia</Badge>
  return <Badge>Inactivo</Badge>
}

export default function Drivers() {
  const role = useAuthStore(s => s.user?.role)
  const editable = canEdit(role)

  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  const [openDriver, setOpenDriver] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)

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
      const d = await apiGetData<Driver[]>('/api/fleet/drivers')
      setDrivers(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sortedDrivers = useMemo(() => [...drivers].sort((a, b) => (a.nombre < b.nombre ? -1 : 1)), [drivers])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Operadores</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Registro y disponibilidad.</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              disabled={!editable}
              onClick={() => {
                setEditingDriver(null)
                resetDriver({ rut: '', nombre: '', licencia_clase: '', telefono: '', status: 'disponible' })
                setOpenDriver(true)
              }}
            >
              Nuevo operador
            </Button>
          </div>
        </div>

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
                    Sin operadores.
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
      </Card>

      <Modal
        open={openDriver}
        title={editingDriver ? 'Editar operador' : 'Nuevo operador'}
        description={editable ? 'Registra el operador y su disponibilidad.' : 'Tu rol es solo lectura.'}
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
