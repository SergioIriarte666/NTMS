import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AnimatedTowTruckLogo } from '@/components/media/AnimatedTowTruckLogo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiPostJson } from '@/utils/api'
import { useAuthStore, type Role } from '@/stores/authStore'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
  role: z.enum(['admin', 'operaciones', 'facturacion', 'consulta']),
})

type FormValues = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore(s => s.setSession)
  const hydrate = useAuthStore(s => s.hydrate)
  const token = useAuthStore(s => s.token)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (token) navigate('/app/dashboard', { replace: true })
  }, [token, navigate])

  const defaultValues = useMemo<FormValues>(
    () => ({
      email: 'demo@gruas.cl',
      password: 'demo',
      role: 'operaciones',
    }),
    [],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
              <AnimatedTowTruckLogo className="h-7 w-7" />
            </div>
            <div>
              <div className="text-sm font-semibold">Administración de Grúas</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Clientes · Servicios · Flota · Facturación
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="text-base font-semibold">Ingreso</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Accede con un usuario de demo y el rol que quieras probar.
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(async values => {
                setServerError(null)
                try {
                  const res = await apiPostJson<{
                    success: true
                    token: string
                    refresh_token: string
                    user: { role: Role; id: string; email: string; full_name: string; is_active: boolean }
                  }>(
                    '/api/auth/login',
                    values,
                  )
                  setSession(res.token, res.refresh_token, res.user)
                  navigate('/app/dashboard', { replace: true })
                } catch (e) {
                  setServerError(e instanceof Error ? e.message : 'Error al ingresar')
                }
              })}
            >
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="mt-1">
                  <Input
                    id="email"
                    placeholder="tu@empresa.cl"
                    autoComplete="email"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <div className="mt-1">
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                    error={errors.password?.message}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="text-sm font-medium">
                  Rol
                </label>
                <div className="mt-1">
                  <Select id="role" {...register('role')} error={errors.role?.message}>
                    <option value="admin">Administrador</option>
                    <option value="operaciones">Operaciones</option>
                    <option value="facturacion">Facturación</option>
                    <option value="consulta">Consulta</option>
                  </Select>
                </div>
              </div>

              {serverError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                  {serverError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Ingresando…' : 'Ingresar'}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="border-dashed">
            <div className="text-base font-semibold">Roles y permisos (demo)</div>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <li>Administrador: CRUD completo en todos los módulos.</li>
              <li>Operaciones: clientes/servicios/flota (CRUD); facturación (solo lectura).</li>
              <li>Facturación: facturas/pagos (CRUD); servicios (solo lectura).</li>
              <li>Consulta: solo lectura en todo.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
