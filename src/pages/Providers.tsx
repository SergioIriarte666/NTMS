import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { apiGetData, apiPatchData, apiPostData, apiRequest } from '@/utils/api'
import type { Provider } from '@/types/domain'
import { useAuthStore } from '@/stores/authStore'

function canEdit(role: string | undefined) {
  return role === 'admin' || role === 'operaciones'
}

const schema = z.object({
  rut: z.string().optional(),
  razon_social: z.string().min(1, 'Razón social es requerida'),
  giro: z.string().optional(),
  direccion: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export default function Providers() {
  const role = useAuthStore(s => s.user?.role)
  const editable = canEdit(role)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Provider | null>(null)
  const [query, setQuery] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rut: '',
      razon_social: '',
      giro: '',
      direccion: '',
      email: '',
      telefono: '',
      payment_terms: '',
      notes: '',
      is_active: true,
    },
  })

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiGetData<Provider[]>('/api/providers')
      setProviders(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return providers
    return providers.filter(p => {
      const hay = [p.razon_social, p.rut, p.email, p.telefono, p.direccion, p.giro]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [providers, query])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Proveedores</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Catálogo y condiciones comerciales.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-72 max-w-full">
              <Input placeholder="Buscar…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <Button
              variant="primary"
              disabled={!editable}
              onClick={() => {
                setEditing(null)
                reset({
                  rut: '',
                  razon_social: '',
                  giro: '',
                  direccion: '',
                  email: '',
                  telefono: '',
                  payment_terms: '',
                  notes: '',
                  is_active: true,
                })
                setOpen(true)
              }}
            >
              Nuevo proveedor
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Razón social</th>
                <th className="px-3 py-2">RUT</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">Activo</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr
                  key={p.id}
                  className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                >
                  <td className="px-3 py-2 font-medium">{p.razon_social}</td>
                  <td className="px-3 py-2">{p.rut || '—'}</td>
                  <td className="px-3 py-2">{p.email || '—'}</td>
                  <td className="px-3 py-2">{p.telefono || '—'}</td>
                  <td className="px-3 py-2">{p.is_active ? 'Sí' : 'No'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditing(p)
                          reset({
                            rut: p.rut || '',
                            razon_social: p.razon_social,
                            giro: p.giro || '',
                            direccion: p.direccion || '',
                            email: p.email || '',
                            telefono: p.telefono || '',
                            payment_terms: p.payment_terms || '',
                            notes: p.notes || '',
                            is_active: p.is_active,
                          })
                          setOpen(true)
                        }}
                      >
                        Ver / editar
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!editable}
                        onClick={async () => {
                          if (!editable) return
                          await apiRequest<{ success: true }>(`/api/providers/${p.id}`, { method: 'DELETE' })
                          await load()
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={6}>
                    Sin proveedores.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={6}>
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
        title={editing ? 'Editar proveedor' : 'Nuevo proveedor'}
        description={editable ? 'Completa la ficha del proveedor.' : 'Tu rol es solo lectura.'}
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
                  rut: values.rut ? values.rut.trim() : undefined,
                  email: values.email ? values.email : undefined,
                  is_active: values.is_active ?? true,
                }
                if (editing) {
                  await apiPatchData<Provider>(`/api/providers/${editing.id}`, payload)
                } else {
                  await apiPostData<Provider>('/api/providers', payload)
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
          <div>
            <label className="text-sm font-medium">RUT</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('rut')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Razón social</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('razon_social')} error={errors.razon_social?.message} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Giro</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('giro')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Dirección</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('direccion')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('email')} error={errors.email?.message} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Teléfono</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('telefono')} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Condiciones comerciales</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('payment_terms')} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Notas</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('notes')} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={!editable}
                className="h-4 w-4 rounded border border-black/20 bg-white dark:border-white/20 dark:bg-zinc-950"
                {...register('is_active')}
              />
              <span>Proveedor activo</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}

