import { Router, type Request, type Response } from 'express'
import { type Role } from '../db.js'
import { getSupabaseAdmin, getSupabaseAnon, supabaseErrorToMessage } from '../supabase.js'

async function seedUserDemoData(userId: string) {
  const supabase = getSupabaseAdmin()
  const existingClients = await supabase.from('clients').select('id, direccion').eq('user_id', userId)
  if (existingClients.data && existingClients.data.length > 0) {
    const existingBranches = await supabase.from('client_branches').select('id').eq('user_id', userId).limit(1)
    if (!existingBranches.data || existingBranches.data.length === 0) {
      const inserted = await supabase
        .from('client_branches')
        .insert(
          existingClients.data.map(c => ({
            user_id: userId,
            client_id: c.id,
            name: 'Casa Matriz',
            direccion: c.direccion ?? null,
            is_default: true,
          })),
        )
        .select('id, client_id')

      if (inserted.data && inserted.data.length > 0) {
        for (const b of inserted.data) {
          await supabase
            .from('services')
            .update({ branch_id: b.id })
            .eq('user_id', userId)
            .eq('client_id', b.client_id)
            .is('branch_id', null)

          await supabase
            .from('invoices')
            .update({ branch_id: b.id })
            .eq('user_id', userId)
            .eq('client_id', b.client_id)
            .is('branch_id', null)
        }
      }
    }
    return
  }

  const today = new Date().toISOString().slice(0, 10)
  const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const clients = await supabase
    .from('clients')
    .insert([
      {
        user_id: userId,
        rut: '76.123.456-7',
        razon_social: 'Aseguradora Andes SpA',
        giro: 'Seguros',
        direccion: 'Santiago Centro',
        email: 'contacto@andes.cl',
        telefono: '+56 2 2345 6789',
        is_active: true,
        payment_terms: '30 días',
        notes: 'Priorizar servicios 24/7',
      },
      {
        user_id: userId,
        rut: '96.777.888-9',
        razon_social: 'Concesionaria Ruta Sur',
        giro: 'Concesiones',
        direccion: 'San Bernardo',
        email: 'operaciones@rutasur.cl',
        telefono: '+56 9 8765 4321',
        is_active: true,
        payment_terms: '15 días',
        notes: 'Facturación quincenal',
      },
    ])
    .select('*')

  if (clients.error || !clients.data || clients.data.length < 2) return

  const c1 = clients.data[0]
  const c2 = clients.data[1]

  const branches = await supabase
    .from('client_branches')
    .insert([
      {
        user_id: userId,
        client_id: c1.id,
        name: 'Casa Matriz',
        direccion: 'Santiago Centro',
        email: 'matriz@andes.cl',
        telefono: '+56 2 2345 6789',
        is_default: true,
      },
      {
        user_id: userId,
        client_id: c1.id,
        name: 'Sucursal Norte',
        direccion: 'Quilicura',
        email: 'norte@andes.cl',
        telefono: '+56 2 2400 0000',
        is_default: false,
      },
      {
        user_id: userId,
        client_id: c2.id,
        name: 'Casa Matriz',
        direccion: 'San Bernardo',
        email: 'contacto@rutasur.cl',
        telefono: '+56 9 8765 4321',
        is_default: true,
      },
      {
        user_id: userId,
        client_id: c2.id,
        name: 'Sucursal Sur',
        direccion: 'Buin',
        email: 'sur@rutasur.cl',
        telefono: '+56 9 8000 0000',
        is_default: false,
      },
    ])
    .select('*')

  const c1Branches = (branches.data ?? []).filter(b => String(b.client_id) === String(c1.id))
  const c2Branches = (branches.data ?? []).filter(b => String(b.client_id) === String(c2.id))
  const c1Default = c1Branches.find(b => b.is_default) ?? c1Branches[0]
  const c2Default = c2Branches.find(b => b.is_default) ?? c2Branches[0]

  const vehicles = await supabase
    .from('vehicles')
    .insert([
      {
        user_id: userId,
        patente: 'ABCD12',
        tipo: 'Pesada',
        capacidad: '5T',
        empresa_rut: '76.769.841-0',
        empresa_razon_social: 'Gruas 5 Norte',
        marca: 'Freightliner',
        modelo: 'Columbia',
        categoria_peaje: 'Camión Pesado',
        venc_permiso_circulacion: '2026-09-30',
        venc_seguro: '2026-09-30',
        venc_revision_tecnica: '2025-11-08',
        status: 'disponible',
        is_active: true,
      },
      {
        user_id: userId,
        patente: 'WXYZ34',
        tipo: 'Liviana',
        capacidad: '3.5T',
        empresa_rut: '76.769.841-0',
        empresa_razon_social: 'Gruas 5 Norte',
        marca: 'Isuzu',
        modelo: 'NPR',
        categoria_peaje: 'Camión Liviano',
        venc_permiso_circulacion: '2026-03-31',
        venc_seguro: '2026-03-31',
        venc_revision_tecnica: '2025-08-20',
        status: 'ocupado',
        is_active: true,
      },
    ])
    .select('*')

  if (vehicles.error || !vehicles.data || vehicles.data.length < 2) return
  const v1 = vehicles.data[0]
  const v2 = vehicles.data[1]

  const drivers = await supabase
    .from('drivers')
    .insert([
      {
        user_id: userId,
        rut: '12.345.678-5',
        nombre: 'Carlos Rivas',
        licencia_clase: 'A2',
        telefono: '+56 9 5555 1111',
        status: 'disponible',
        is_active: true,
      },
      {
        user_id: userId,
        rut: '9.876.543-2',
        nombre: 'María López',
        licencia_clase: 'A4',
        telefono: '+56 9 4444 2222',
        status: 'ocupado',
        is_active: true,
      },
    ])
    .select('*')

  if (drivers.error || !drivers.data || drivers.data.length < 2) return
  const d1 = drivers.data[0]
  const d2 = drivers.data[1]

  const services = await supabase
    .from('services')
    .insert([
      {
        user_id: userId,
        client_id: c1.id,
        branch_id: c1Default?.id ?? null,
        service_date: today,
        start_time: '10:30',
        origin: 'Providencia',
        destination: 'Pudahuel',
        service_type: 'Arrastre',
        status: 'asignado',
        vehicle_id: v1.id,
        driver_id: d1.id,
        agreed_amount: 65000,
        notes: 'Vehículo liviano',
      },
      {
        user_id: userId,
        client_id: c2.id,
        branch_id: c2Default?.id ?? null,
        service_date: today,
        start_time: '08:15',
        origin: 'San Bernardo',
        destination: 'Buin',
        service_type: 'Asistencia en ruta',
        status: 'completado',
        vehicle_id: v2.id,
        driver_id: d2.id,
        agreed_amount: 90000,
        notes: 'Se adjuntan evidencias',
        completed_at: new Date().toISOString(),
      },
    ])
    .select('*')

  if (services.error || !services.data || services.data.length < 2) return
  const s2 = services.data[1]

  const tax = Math.round(90000 * 0.19)
  const invoice = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      client_id: c2.id,
      service_id: s2.id,
      branch_id: c2Default?.id ?? null,
      invoice_number: 'F-000123',
      issue_date: today,
      due_date: due,
      subtotal: 90000,
      tax,
      total: 90000 + tax,
      status: 'emitida',
    })
    .select('*')
    .single()

  if (invoice.error || !invoice.data) return

  await supabase.from('payments').insert({
    user_id: userId,
    invoice_id: invoice.data.id,
    paid_date: today,
    method: 'Transferencia',
    amount: invoice.data.total,
    reference: 'TRX-12093',
  })
}

const router = Router()

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const role = String(req.body?.role ?? 'consulta') as Role

  const allowedRoles: Role[] = ['admin', 'operaciones', 'facturacion', 'consulta']
  if (!email || !email.includes('@') || password.length < 6 || !allowedRoles.includes(role)) {
    res.status(400).json({ success: false, error: 'Credenciales inválidas' })
    return
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, is_active: true },
    })
    if (error || !data.user) {
      res.status(400).json({ success: false, error: supabaseErrorToMessage(error, 'No se pudo crear el usuario') })
      return
    }
    res.status(201).json({ success: true, user_id: data.user.id })
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : 'Error al registrar' })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const role = String(req.body?.role ?? '') as Role

  const allowedRoles: Role[] = ['admin', 'operaciones', 'facturacion', 'consulta']
  if (!email || !email.includes('@') || password.length < 1 || !allowedRoles.includes(role)) {
    res.status(400).json({ success: false, error: 'Credenciales inválidas' })
    return
  }

  const supabaseAnon = getSupabaseAnon()
  const supabaseAdmin = getSupabaseAdmin()

  async function signIn() {
    return supabaseAnon.auth.signInWithPassword({ email, password })
  }

  let { data, error } = await signIn()

  const allowSeed = String(process.env.ALLOW_DEMO_USER_SEED ?? 'false').toLowerCase() === 'true'
  const invalidCreds = !!error && /invalid login credentials/i.test(String(error.message ?? ''))
  if (allowSeed && invalidCreds) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, is_active: true },
    })
    if (created.error) {
      res.status(400).json({ success: false, error: supabaseErrorToMessage(created.error, 'No se pudo crear usuario demo') })
      return
    }
    ;({ data, error } = await signIn())
  }

  if (error || !data.session || !data.user) {
    res.status(401).json({ success: false, error: supabaseErrorToMessage(error, 'Credenciales inválidas') })
    return
  }

  const existingRole = data.user.user_metadata?.role
  if (existingRole !== role) {
    await supabaseAdmin.auth.admin.updateUserById(data.user.id, { user_metadata: { ...data.user.user_metadata, role } })
  }

  if (allowSeed) {
    await seedUserDemoData(data.user.id)
  }

  res.status(200).json({
    success: true,
    token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: String(data.user.email ?? email),
      full_name: String(data.user.user_metadata?.full_name ?? ''),
      role,
      is_active: data.user.user_metadata?.is_active === false ? false : true,
    },
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true })
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const auth = String(req.headers.authorization ?? '')
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined
  if (!token) {
    res.status(401).json({ success: false, error: 'No autorizado' })
    return
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ success: false, error: 'Sesión inválida' })
    return
  }

  const roleRaw = data.user.user_metadata?.role
  const allowedRoles: Role[] = ['admin', 'operaciones', 'facturacion', 'consulta']
  const role = allowedRoles.includes(roleRaw) ? (roleRaw as Role) : 'consulta'

  res.status(200).json({
    success: true,
    user: {
      id: data.user.id,
      email: String(data.user.email ?? ''),
      full_name: String(data.user.user_metadata?.full_name ?? ''),
      role,
      is_active: data.user.user_metadata?.is_active === false ? false : true,
    },
  })
})

export default router
