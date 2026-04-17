import crypto from 'crypto'

export type Role = 'admin' | 'operaciones' | 'facturacion' | 'consulta'

export type Client = {
  id: string
  rut: string
  razon_social: string
  giro?: string
  direccion?: string
  email?: string
  telefono?: string
  is_active: boolean
  payment_terms?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type VehicleStatus = 'disponible' | 'ocupado' | 'mantencion' | 'inactivo'

export type Vehicle = {
  id: string
  patente: string
  tipo?: string
  capacidad?: string
  status: VehicleStatus
  is_active: boolean
  created_at: string
  updated_at: string
}

export type DriverStatus = 'disponible' | 'ocupado' | 'licencia' | 'inactivo'

export type Driver = {
  id: string
  rut: string
  nombre: string
  licencia_clase?: string
  telefono?: string
  status: DriverStatus
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ServiceStatus = 'pendiente' | 'asignado' | 'en_curso' | 'completado' | 'cancelado'

export type Service = {
  id: string
  client_id: string
  service_date: string
  start_time?: string
  origin?: string
  destination?: string
  service_type?: string
  status: ServiceStatus
  vehicle_id?: string
  driver_id?: string
  agreed_amount?: number
  notes?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export type InvoiceStatus = 'borrador' | 'emitida' | 'pagada' | 'anulada' | 'vencida'

export type Invoice = {
  id: string
  client_id: string
  service_id?: string
  invoice_number?: string
  issue_date: string
  due_date?: string
  subtotal: number
  tax: number
  total: number
  status: InvoiceStatus
  created_at: string
  updated_at: string
}

export type Payment = {
  id: string
  invoice_id: string
  paid_date: string
  method?: string
  amount: number
  reference?: string
  created_at: string
}

export type Session = {
  token: string
  user: {
    id: string
    email: string
    full_name: string
    role: Role
    is_active: boolean
  }
  created_at: string
}

export type Db = {
  clients: Client[]
  vehicles: Vehicle[]
  drivers: Driver[]
  services: Service[]
  invoices: Invoice[]
  payments: Payment[]
  sessions: Session[]
}

function nowIso() {
  return new Date().toISOString()
}

function newId() {
  return crypto.randomUUID()
}

function newToken() {
  return crypto.randomBytes(24).toString('base64url')
}

export const db: Db = {
  clients: [],
  vehicles: [],
  drivers: [],
  services: [],
  invoices: [],
  payments: [],
  sessions: [],
}

export function seedDb() {
  if (db.clients.length > 0) return

  const t = nowIso()

  const c1: Client = {
    id: newId(),
    rut: '76.123.456-7',
    razon_social: 'Aseguradora Andes SpA',
    giro: 'Seguros',
    direccion: 'Santiago Centro',
    email: 'contacto@andes.cl',
    telefono: '+56 2 2345 6789',
    is_active: true,
    payment_terms: '30 días',
    notes: 'Priorizar servicios 24/7',
    created_at: t,
    updated_at: t,
  }

  const c2: Client = {
    id: newId(),
    rut: '96.777.888-9',
    razon_social: 'Concesionaria Ruta Sur',
    giro: 'Concesiones',
    direccion: 'San Bernardo',
    email: 'operaciones@rutasur.cl',
    telefono: '+56 9 8765 4321',
    is_active: true,
    payment_terms: '15 días',
    notes: 'Facturación quincenal',
    created_at: t,
    updated_at: t,
  }

  const v1: Vehicle = {
    id: newId(),
    patente: 'ABCD12',
    tipo: 'Pluma',
    capacidad: '5T',
    status: 'disponible',
    is_active: true,
    created_at: t,
    updated_at: t,
  }

  const v2: Vehicle = {
    id: newId(),
    patente: 'WXYZ34',
    tipo: 'Plataforma',
    capacidad: '3.5T',
    status: 'ocupado',
    is_active: true,
    created_at: t,
    updated_at: t,
  }

  const d1: Driver = {
    id: newId(),
    rut: '12.345.678-5',
    nombre: 'Carlos Rivas',
    licencia_clase: 'A2',
    telefono: '+56 9 5555 1111',
    status: 'disponible',
    is_active: true,
    created_at: t,
    updated_at: t,
  }

  const d2: Driver = {
    id: newId(),
    rut: '9.876.543-2',
    nombre: 'María López',
    licencia_clase: 'A4',
    telefono: '+56 9 4444 2222',
    status: 'ocupado',
    is_active: true,
    created_at: t,
    updated_at: t,
  }

  const s1: Service = {
    id: newId(),
    client_id: c1.id,
    service_date: new Date().toISOString().slice(0, 10),
    start_time: '10:30',
    origin: 'Providencia',
    destination: 'Pudahuel',
    service_type: 'Arrastre',
    status: 'asignado',
    vehicle_id: v1.id,
    driver_id: d1.id,
    agreed_amount: 65000,
    notes: 'Vehículo liviano',
    created_at: t,
    updated_at: t,
  }

  const s2: Service = {
    id: newId(),
    client_id: c2.id,
    service_date: new Date().toISOString().slice(0, 10),
    start_time: '08:15',
    origin: 'San Bernardo',
    destination: 'Buin',
    service_type: 'Asistencia en ruta',
    status: 'completado',
    vehicle_id: v2.id,
    driver_id: d2.id,
    agreed_amount: 90000,
    notes: 'Se adjuntan evidencias',
    completed_at: t,
    created_at: t,
    updated_at: t,
  }

  const inv1: Invoice = {
    id: newId(),
    client_id: c2.id,
    service_id: s2.id,
    invoice_number: 'F-000123',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    subtotal: 90000,
    tax: Math.round(90000 * 0.19),
    total: 90000 + Math.round(90000 * 0.19),
    status: 'emitida',
    created_at: t,
    updated_at: t,
  }

  const pay1: Payment = {
    id: newId(),
    invoice_id: inv1.id,
    paid_date: new Date().toISOString().slice(0, 10),
    method: 'Transferencia',
    amount: inv1.total,
    reference: 'TRX-12093',
    created_at: t,
  }

  db.clients.push(c1, c2)
  db.vehicles.push(v1, v2)
  db.drivers.push(d1, d2)
  db.services.push(s1, s2)
  db.invoices.push(inv1)
  db.payments.push(pay1)
}

export function createSession(input: { email: string; role: Role; full_name?: string }) {
  const created_at = nowIso()
  const session: Session = {
    token: newToken(),
    user: {
      id: newId(),
      email: input.email,
      full_name: input.full_name ?? input.email.split('@')[0] ?? 'Usuario',
      role: input.role,
      is_active: true,
    },
    created_at,
  }
  db.sessions.push(session)
  return session
}

export function getSessionByToken(token: string) {
  return db.sessions.find(s => s.token === token)
}

export function deleteSession(token: string) {
  const idx = db.sessions.findIndex(s => s.token === token)
  if (idx >= 0) db.sessions.splice(idx, 1)
}

export function touch<T extends { updated_at: string }>(obj: T): T {
  return { ...obj, updated_at: nowIso() }
}

export function createClient(input: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
  const t = nowIso()
  const client: Client = {
    ...input,
    id: newId(),
    created_at: t,
    updated_at: t,
  }
  db.clients.push(client)
  return client
}

export function updateClient(id: string, patch: Partial<Omit<Client, 'id' | 'created_at'>>) {
  const idx = db.clients.findIndex(c => c.id === id)
  if (idx < 0) return null
  const updated = touch({ ...db.clients[idx], ...patch })
  db.clients[idx] = updated
  return updated
}

export function createVehicle(input: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
  const t = nowIso()
  const vehicle: Vehicle = {
    ...input,
    id: newId(),
    created_at: t,
    updated_at: t,
  }
  db.vehicles.push(vehicle)
  return vehicle
}

export function updateVehicle(id: string, patch: Partial<Omit<Vehicle, 'id' | 'created_at'>>) {
  const idx = db.vehicles.findIndex(v => v.id === id)
  if (idx < 0) return null
  const updated = touch({ ...db.vehicles[idx], ...patch })
  db.vehicles[idx] = updated
  return updated
}

export function createDriver(input: Omit<Driver, 'id' | 'created_at' | 'updated_at'>) {
  const t = nowIso()
  const driver: Driver = {
    ...input,
    id: newId(),
    created_at: t,
    updated_at: t,
  }
  db.drivers.push(driver)
  return driver
}

export function updateDriver(id: string, patch: Partial<Omit<Driver, 'id' | 'created_at'>>) {
  const idx = db.drivers.findIndex(d => d.id === id)
  if (idx < 0) return null
  const updated = touch({ ...db.drivers[idx], ...patch })
  db.drivers[idx] = updated
  return updated
}

export function createService(input: Omit<Service, 'id' | 'created_at' | 'updated_at'>) {
  const t = nowIso()
  const service: Service = {
    ...input,
    id: newId(),
    created_at: t,
    updated_at: t,
  }
  db.services.push(service)
  return service
}

export function updateService(id: string, patch: Partial<Omit<Service, 'id' | 'created_at'>>) {
  const idx = db.services.findIndex(s => s.id === id)
  if (idx < 0) return null
  const updated = touch({ ...db.services[idx], ...patch })
  db.services[idx] = updated
  return updated
}

export function createInvoice(input: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'subtotal' | 'tax' | 'total'> & { subtotal: number; tax: number; total: number }) {
  const t = nowIso()
  const invoice: Invoice = {
    ...input,
    id: newId(),
    created_at: t,
    updated_at: t,
  }
  db.invoices.push(invoice)
  return invoice
}

export function updateInvoice(id: string, patch: Partial<Omit<Invoice, 'id' | 'created_at'>>) {
  const idx = db.invoices.findIndex(i => i.id === id)
  if (idx < 0) return null
  const updated = touch({ ...db.invoices[idx], ...patch })
  db.invoices[idx] = updated
  return updated
}

export function createPayment(input: Omit<Payment, 'id' | 'created_at'>) {
  const created_at = nowIso()
  const payment: Payment = {
    ...input,
    id: newId(),
    created_at,
  }
  db.payments.push(payment)
  return payment
}

