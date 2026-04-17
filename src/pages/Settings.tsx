import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useAuthStore, type Role } from '@/stores/authStore'

const companySchema = z.object({
  razon_social: z.string().min(1, 'Requerido'),
  rut: z.string().min(1, 'Requerido'),
  direccion: z.string().optional(),
  invoice_series: z.string().optional(),
})

type CompanyForm = z.infer<typeof companySchema>

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(1, 'Nombre requerido'),
  role: z.enum(['admin', 'operaciones', 'facturacion', 'consulta']),
})

type InviteForm = z.infer<typeof inviteSchema>

type LocalUser = {
  id: string
  email: string
  full_name: string
  role: Role
  is_active: boolean
}

const companyKey = 'company_settings'
const usersKey = 'users_settings'

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function newId() {
  return crypto.randomUUID()
}

export default function Settings() {
  const currentUser = useAuthStore(s => s.user)
  const [openInvite, setOpenInvite] = useState(false)
  const [users, setUsers] = useState<LocalUser[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
  })

  const {
    register: registerInvite,
    handleSubmit: handleInviteSubmit,
    reset: resetInvite,
    formState: { errors: inviteErrors, isSubmitting: isInviteSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  })

  useEffect(() => {
    const raw = localStorage.getItem(companyKey)
    const company = raw ? safeParse<CompanyForm>(raw) : null
    reset(
      company ?? {
        razon_social: 'Empresa de Grúas (demo)',
        rut: '76.000.000-0',
        direccion: 'Santiago, Chile',
        invoice_series: 'F',
      },
    )

    const rawUsers = localStorage.getItem(usersKey)
    const storedUsers = rawUsers ? safeParse<LocalUser[]>(rawUsers) : null
    setUsers(
      storedUsers ??
        [
          {
            id: currentUser?.id ?? newId(),
            email: currentUser?.email ?? 'demo@gruas.cl',
            full_name: currentUser?.full_name ?? 'Demo',
            role: currentUser?.role ?? 'operaciones',
            is_active: true,
          },
        ],
    )
  }, [reset, currentUser])

  const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Configuración</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Datos de empresa y gestión básica de usuarios.
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold">Datos de empresa</div>
            <form
              className="mt-3 grid gap-4"
              onSubmit={handleSubmit(async values => {
                localStorage.setItem(companyKey, JSON.stringify(values))
              })}
            >
              <div>
                <label className="text-sm font-medium">Razón social</label>
                <div className="mt-1">
                  <Input {...register('razon_social')} error={errors.razon_social?.message} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">RUT</label>
                <div className="mt-1">
                  <Input {...register('rut')} error={errors.rut?.message} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Dirección</label>
                <div className="mt-1">
                  <Input {...register('direccion')} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Serie/folio interno</label>
                <div className="mt-1">
                  <Input {...register('invoice_series')} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  Guardar
                </Button>
              </div>
            </form>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Usuarios y roles</div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Solo demo local. Admin puede invitar.
                </div>
              </div>
              <Button
                variant="primary"
                disabled={!isAdmin}
                onClick={() => {
                  resetInvite({ email: '', full_name: '', role: 'consulta' })
                  setOpenInvite(true)
                }}
              >
                Invitar
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                  <tr>
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr
                      key={u.id}
                      className="border-t border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950"
                    >
                      <td className="px-3 py-2 font-medium">{u.full_name}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        open={openInvite}
        title="Invitar usuario"
        description={isAdmin ? 'Crea un usuario demo en este navegador.' : 'Solo disponible para Admin.'}
        onClose={() => setOpenInvite(false)}
        footer={
          <>
            <Button onClick={() => setOpenInvite(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!isAdmin || isInviteSubmitting}
              onClick={handleInviteSubmit(async values => {
                if (!isAdmin) return
                const next: LocalUser[] = [
                  ...users,
                  {
                    id: newId(),
                    email: values.email,
                    full_name: values.full_name,
                    role: values.role,
                    is_active: true,
                  },
                ]
                setUsers(next)
                localStorage.setItem(usersKey, JSON.stringify(next))
                setOpenInvite(false)
              })}
            >
              Crear
            </Button>
          </>
        }
      >
        <form className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <div className="mt-1">
              <Input disabled={!isAdmin} {...registerInvite('full_name')} error={inviteErrors.full_name?.message} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <div className="mt-1">
              <Input disabled={!isAdmin} {...registerInvite('email')} error={inviteErrors.email?.message} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Rol</label>
            <div className="mt-1">
              <Select disabled={!isAdmin} {...registerInvite('role')} error={inviteErrors.role?.message}>
                <option value="admin">Administrador</option>
                <option value="operaciones">Operaciones</option>
                <option value="facturacion">Facturación</option>
                <option value="consulta">Consulta</option>
              </Select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

