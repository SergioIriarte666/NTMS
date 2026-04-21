import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { apiGetData, apiPatchData, apiPostData } from '@/utils/api'
import type { Vehicle, VehicleStatus } from '@/types/domain'
import { useAuthStore } from '@/stores/authStore'

function canEdit(role: string | undefined) {
  return role === 'admin' || role === 'operaciones'
}

const vehicleSchema = z.object({
  patente: z.string().min(1, 'Patente requerida'),
  tipo: z.string().min(1, 'Tipo requerido'),
  empresa_rut: z.string().min(1, 'RUT requerido'),
  empresa_razon_social: z.string().optional(),
  categoria_peaje: z.string().optional(),
  marca: z.string().min(1, 'Marca requerida'),
  modelo: z.string().min(1, 'Modelo requerido'),
  venc_permiso_circulacion: z.string().optional().or(z.literal('')),
  venc_seguro: z.string().optional().or(z.literal('')),
  venc_revision_tecnica: z.string().optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  status: z.enum(['disponible', 'ocupado', 'mantencion', 'inactivo']),
})

type VehicleForm = z.infer<typeof vehicleSchema>

function statusBadge(status: VehicleStatus) {
  if (status === 'disponible') return <Badge variant="success">Disponible</Badge>
  if (status === 'ocupado') return <Badge variant="warning">Ocupado</Badge>
  if (status === 'mantencion') return <Badge variant="danger">Mantención</Badge>
  return <Badge>Inactivo</Badge>
}

export default function Fleet() {
  const role = useAuthStore(s => s.user?.role)
  const editable = canEdit(role)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  const [openVehicle, setOpenVehicle] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const {
    register: registerVehicle,
    handleSubmit: handleVehicleSubmit,
    reset: resetVehicle,
    formState: { errors: vehicleErrors, isSubmitting: isVehicleSubmitting },
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      patente: '',
      tipo: '',
      empresa_rut: '',
      empresa_razon_social: '',
      categoria_peaje: '',
      marca: '',
      modelo: '',
      venc_permiso_circulacion: '',
      venc_seguro: '',
      venc_revision_tecnica: '',
      is_active: true,
      status: 'disponible',
    },
  })

  const load = async () => {
    setLoading(true)
    try {
      const v = await apiGetData<Vehicle[]>('/api/fleet/vehicles')
      setVehicles(v)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sortedVehicles = useMemo(() => [...vehicles].sort((a, b) => (a.patente < b.patente ? -1 : 1)), [vehicles])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Flota</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Registro y disponibilidad.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              disabled={!editable}
              onClick={() => {
                setEditingVehicle(null)
                resetVehicle({
                  patente: '',
                  tipo: '',
                  empresa_rut: '',
                  empresa_razon_social: '',
                  categoria_peaje: '',
                  marca: '',
                  modelo: '',
                  venc_permiso_circulacion: '',
                  venc_seguro: '',
                  venc_revision_tecnica: '',
                  is_active: true,
                  status: 'disponible',
                })
                setOpenVehicle(true)
              }}
            >
              Nueva grúa
            </Button>
          </div>
        </div>

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
                          empresa_rut: v.empresa_rut || '',
                          empresa_razon_social: v.empresa_razon_social || '',
                          categoria_peaje: v.categoria_peaje || '',
                          marca: v.marca || '',
                          modelo: v.modelo || '',
                          venc_permiso_circulacion: v.venc_permiso_circulacion || '',
                          venc_seguro: v.venc_seguro || '',
                          venc_revision_tecnica: v.venc_revision_tecnica || '',
                          is_active: v.is_active,
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
      </Card>

      <Modal
        open={openVehicle}
        title={editingVehicle ? 'Modifica los datos de la grúa' : 'Registra los datos de la grúa'}
        titleClassName="text-violet-300"
        closeIcon={<X className="h-5 w-5" />}
        closeLabel="Cerrar"
        description={editable ? undefined : 'Tu rol es solo lectura.'}
        onClose={() => setOpenVehicle(false)}
        footer={
          <>
            <Button onClick={() => setOpenVehicle(false)}>Cancelar</Button>
            <Button
              variant="primary"
              className="rounded-full bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
              disabled={!editable || isVehicleSubmitting}
              onClick={handleVehicleSubmit(async values => {
                if (!editable) return
                const payload = {
                  ...values,
                  patente: values.patente.trim().toUpperCase(),
                  venc_permiso_circulacion: values.venc_permiso_circulacion || undefined,
                  venc_seguro: values.venc_seguro || undefined,
                  venc_revision_tecnica: values.venc_revision_tecnica || undefined,
                  is_active: values.is_active ?? true,
                }
                if (editingVehicle) {
                  await apiPatchData<Vehicle>(`/api/fleet/vehicles/${editingVehicle.id}`, payload)
                } else {
                  await apiPostData<Vehicle>('/api/fleet/vehicles', payload)
                }
                setOpenVehicle(false)
                await load()
              })}
            >
              {editingVehicle ? 'Actualizar Grúa' : 'Crear Grúa'}
            </Button>
          </>
        }
      >
        <form className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold">
              Patente <span className="text-zinc-500">*</span>
            </label>
            <div className="mt-1">
              <Input
                disabled={!editable}
                {...registerVehicle('patente')}
                error={vehicleErrors.patente?.message}
                className="h-11 rounded-xl border-zinc-200 focus:ring-lime-400/30 dark:border-white/10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Empresa (RUT) <span className="text-zinc-500">*</span>
            </label>
            <div className="mt-1">
              <Input
                disabled={!editable}
                {...registerVehicle('empresa_rut')}
                error={vehicleErrors.empresa_rut?.message}
                className="h-11 rounded-xl border-zinc-200 focus:ring-lime-400/30 dark:border-white/10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Tipo <span className="text-zinc-500">*</span>
            </label>
            <div className="mt-1">
              <Select
                disabled={!editable}
                {...registerVehicle('tipo')}
                error={vehicleErrors.tipo?.message}
                className="h-11 rounded-xl border-zinc-200 focus:ring-lime-400/30 dark:border-white/10"
              >
                <option value="">Selecciona…</option>
                <option value="Liviana">Liviana</option>
                <option value="Pesada">Pesada</option>
                <option value="Plataforma">Plataforma</option>
                <option value="Pluma">Pluma</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Categoría Peaje</label>
            <div className="mt-1">
              <Select
                disabled={!editable}
                {...registerVehicle('categoria_peaje')}
                className="h-11 rounded-xl border-zinc-200 focus:ring-lime-400/30 dark:border-white/10"
              >
                <option value="">Selecciona…</option>
                <option value="Camión Liviano">Camión Liviano</option>
                <option value="Camión Pesado">Camión Pesado</option>
                <option value="Remolque">Remolque</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Empresa (Razón Social)</label>
            <div className="mt-1">
              <Input
                disabled={!editable}
                {...registerVehicle('empresa_razon_social')}
                className="h-11 rounded-xl border-zinc-200 focus:ring-lime-400/30 dark:border-white/10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Marca <span className="text-zinc-500">*</span>
            </label>
            <div className="mt-1">
              <Input
                disabled={!editable}
                {...registerVehicle('marca')}
                error={vehicleErrors.marca?.message}
                className="h-11 rounded-xl border-zinc-200 focus:ring-lime-400/30 dark:border-white/10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Modelo <span className="text-zinc-500">*</span>
            </label>
            <div className="mt-1">
              <Input
                disabled={!editable}
                {...registerVehicle('modelo')}
                error={vehicleErrors.modelo?.message}
                className="h-11 rounded-xl border-zinc-200 focus:ring-lime-400/30 dark:border-white/10"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
            <div>
              <label className="text-sm font-semibold">Venc. Permiso Circulación</label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="date"
                  disabled={!editable}
                  {...registerVehicle('venc_permiso_circulacion')}
                  className="h-11 rounded-xl border-zinc-200 pl-10 focus:ring-lime-400/30 dark:border-white/10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Venc. Seguro</label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="date"
                  disabled={!editable}
                  {...registerVehicle('venc_seguro')}
                  className="h-11 rounded-xl border-zinc-200 pl-10 focus:ring-lime-400/30 dark:border-white/10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Venc. Revisión Técnica</label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="date"
                  disabled={!editable}
                  {...registerVehicle('venc_revision_tecnica')}
                  className="h-11 rounded-xl border-zinc-200 pl-10 focus:ring-lime-400/30 dark:border-white/10"
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                disabled={!editable}
                className="peer sr-only"
                {...registerVehicle('is_active')}
              />
              <span className="relative inline-flex h-7 w-12 shrink-0 rounded-full bg-zinc-300 transition peer-checked:bg-zinc-900 peer-disabled:opacity-60 dark:bg-zinc-700 dark:peer-checked:bg-zinc-200 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 dark:after:bg-zinc-950" />
              <span>Grúa Activa</span>
            </label>
          </div>

          <input type="hidden" {...registerVehicle('status')} />
        </form>
      </Modal>
    </div>
  )
}
