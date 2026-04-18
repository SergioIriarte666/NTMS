import { Router, type Response } from 'express'
import { type DriverStatus, type VehicleStatus } from '../db.js'
import { canRead, canWriteCore, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'
import { sendSupabaseError } from '../http.js'
import { getSupabaseAdmin } from '../supabase.js'

const router = Router()

router.get('/vehicles', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false })
      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar las grúas')
        return
      }
      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/vehicles', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const patente = String(req.body?.patente ?? '').trim().toUpperCase()
    const status = String(req.body?.status ?? 'disponible') as VehicleStatus

    if (!patente) {
      res.status(400).json({ success: false, error: 'Patente es requerida' })
      return
    }

    const allowed: VehicleStatus[] = ['disponible', 'ocupado', 'mantencion', 'inactivo']
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, error: 'Estado inválido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const payload = {
        user_id: req.user!.id,
        patente,
        tipo: req.body?.tipo ? String(req.body.tipo) : null,
        capacidad: req.body?.capacidad ? String(req.body.capacidad) : null,
        status,
        is_active: Boolean(req.body?.is_active ?? true),
      }
      const { data, error } = await supabase.from('vehicles').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear la grúa')
        return
      }
      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/vehicles/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const patch = {
        patente: req.body?.patente != null ? String(req.body.patente).trim().toUpperCase() : undefined,
        tipo: req.body?.tipo != null ? String(req.body.tipo) : undefined,
        capacidad: req.body?.capacidad != null ? String(req.body.capacidad) : undefined,
        status: req.body?.status != null ? String(req.body.status) : undefined,
        is_active: req.body?.is_active != null ? Boolean(req.body.is_active) : undefined,
      }
      const { data, error } = await supabase
        .from('vehicles')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()
      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar la grúa')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Grúa no encontrada' })
        return
      }
      res.status(200).json({ success: true, data })
    })()
  })
})

router.get('/drivers', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false })
      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar los choferes')
        return
      }
      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/drivers', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const rut = String(req.body?.rut ?? '').trim()
    const nombre = String(req.body?.nombre ?? '').trim()
    const status = String(req.body?.status ?? 'disponible') as DriverStatus

    if (!nombre) {
      res.status(400).json({ success: false, error: 'Nombre es requerido' })
      return
    }

    const allowed: DriverStatus[] = ['disponible', 'ocupado', 'licencia', 'inactivo']
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, error: 'Estado inválido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const payload = {
        user_id: req.user!.id,
        rut,
        nombre,
        licencia_clase: req.body?.licencia_clase ? String(req.body.licencia_clase) : null,
        telefono: req.body?.telefono ? String(req.body.telefono) : null,
        status,
        is_active: Boolean(req.body?.is_active ?? true),
      }
      const { data, error } = await supabase.from('drivers').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear el chofer')
        return
      }
      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/drivers/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const patch = {
        rut: req.body?.rut != null ? String(req.body.rut).trim() : undefined,
        nombre: req.body?.nombre != null ? String(req.body.nombre).trim() : undefined,
        licencia_clase: req.body?.licencia_clase != null ? String(req.body.licencia_clase) : undefined,
        telefono: req.body?.telefono != null ? String(req.body.telefono) : undefined,
        status: req.body?.status != null ? String(req.body.status) : undefined,
        is_active: req.body?.is_active != null ? Boolean(req.body.is_active) : undefined,
      }
      const { data, error } = await supabase
        .from('drivers')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()
      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar el chofer')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Chofer no encontrado' })
        return
      }
      res.status(200).json({ success: true, data })
    })()
  })
})

export default router
