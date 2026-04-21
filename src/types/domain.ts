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

export type ClientBranch = {
  id: string
  client_id: string
  name: string
  direccion?: string
  email?: string
  telefono?: string
  is_default: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export type Provider = {
  id: string
  rut?: string
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

export type InventoryProduct = {
  id: string
  sku: string
  name: string
  description?: string
  unit?: string
  min_stock?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type InventoryProductWithStock = InventoryProduct & {
  stock: number
}

export type InventoryMovementType = 'ingreso' | 'egreso' | 'ajuste'

export type InventoryMovement = {
  id: string
  product_id: string
  movement_type: InventoryMovementType
  quantity: number
  unit_cost?: number
  reference?: string
  notes?: string
  movement_date: string
  created_at: string
}

export type VehicleBrand = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type VehicleModel = {
  id: string
  brand_id: string
  name: string
  brand_name?: string | null
  created_at: string
  updated_at: string
}

export type VehicleStatus = 'disponible' | 'ocupado' | 'mantencion' | 'inactivo'

export type Vehicle = {
  id: string
  patente: string
  tipo?: string
  capacidad?: string
  empresa_rut?: string
  empresa_razon_social?: string
  marca?: string
  modelo?: string
  categoria_peaje?: string
  venc_permiso_circulacion?: string
  venc_seguro?: string
  venc_revision_tecnica?: string
  status: VehicleStatus
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ExpenseCategory = {
  id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ExpensePaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro'

export type Expense = {
  id: string
  category_id: string
  expense_date: string
  amount: number
  payment_method: ExpensePaymentMethod
  provider_id?: string | null
  attachment_url?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type ExpenseWithDetails = Expense & {
  category?: { id: string; name: string } | null
  provider?: { id: string; razon_social: string } | null
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
  branch_id?: string
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
  branch_id?: string
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
