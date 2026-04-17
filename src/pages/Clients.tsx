import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { apiGetData, apiPatchData, apiPostData } from '@/utils/api'
import type { Client } from '@/types/domain'
import { useAuthStore } from '@/stores/authStore'

const schema = z.object({
  rut: z.string().optional(),
  razon_social: z.string().min(1, 'Razón social es requerida'),
  giro: z.string().optional(),
  direccion: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function canEdit(role: string | undefined) {
  return role === 'admin' || role === 'operaciones'
}

export default function Clients() {
  const role = useAuthStore(s => s.user?.role)
  const editable = canEdit(role)
  const [clients, setClients] = useState<Client[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiGetData<Client[]>('/api/clients')
      setClients(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      [c.razon_social, c.rut, c.email, c.telefono].filter(Boolean).some(v => String(v).toLowerCase().includes(q)),
    )
  }, [clients, query])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Clientes</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Gestión de ficha y condiciones comerciales.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-64">
              <Input
                placeholder="Buscar por razón social, RUT…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
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
                <th className="px-3 py-2">Razón social</th>
                <th className="px-3 py-2">RUT</th>
                <th className="px-3 py-2">Contacto</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr
                  key={c.id}
                  className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                >
                  <td className="px-3 py-2 font-medium">{c.razon_social}</td>
                  <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">{c.rut || '—'}</td>
                  <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">
                    {c.email || c.telefono || '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditing(c)
                        reset({
                          rut: c.rut || '',
                          razon_social: c.razon_social || '',
                          giro: c.giro || '',
                          direccion: c.direccion || '',
                          email: c.email || '',
                          telefono: c.telefono || '',
                          payment_terms: c.payment_terms || '',
                          notes: c.notes || '',
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
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={4}>
                    Sin resultados.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={4}>
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
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
        description={editable ? 'Completa la ficha del cliente.' : 'Tu rol es solo lectura.'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!editable || isSubmitting}
              onClick={handleSubmit(async values => {
                if (!editable) return
                if (editing) {
                  await apiPatchData<Client>(`/api/clients/${editing.id}`, values)
                } else {
                  await apiPostData<Client>('/api/clients', { ...values, is_active: true })
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
            <label className="text-sm font-medium">Razón social</label>
            <div className="mt-1">
              <Input
                disabled={!editable}
                {...register('razon_social')}
                error={errors.razon_social?.message}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">RUT</label>
            <div className="mt-1">
              <Input disabled={!editable} {...register('rut')} error={errors.rut?.message} />
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
        </form>
      </Modal>
    </div>
  )
}

