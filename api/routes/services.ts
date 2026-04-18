import { Router, type Response } from 'express'
import { type ServiceStatus } from '../db.js'
import { canRead, canWriteCore, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'
import { sendSupabaseError } from '../http.js'
import { getSupabaseAdmin } from '../supabase.js'

const router = Router()

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const status = req.query.status ? String(req.query.status) : undefined
      const date = req.query.date ? String(req.query.date) : undefined

      let query = supabase
        .from('services')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('service_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (status) query = query.eq('status', status)
      if (date) query = query.eq('service_date', date)

      const { data, error } = await query
      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar los servicios')
        return
      }
      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const client_id = String(req.body?.client_id ?? '')
    const service_date = String(req.body?.service_date ?? '').slice(0, 10)
    const status = String(req.body?.status ?? 'pendiente') as ServiceStatus
    const branch_id_raw = req.body?.branch_id != null ? String(req.body.branch_id) : undefined
    const branch_id = branch_id_raw && branch_id_raw.trim() ? branch_id_raw.trim() : undefined

    if (!client_id || !service_date) {
      res.status(400).json({ success: false, error: 'client_id y service_date son requeridos' })
      return
    }

    const allowed: ServiceStatus[] = ['pendiente', 'asignado', 'en_curso', 'completado', 'cancelado']
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, error: 'Estado inválido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()

      if (branch_id) {
        const { data: branch, error: branchErr } = await supabase
          .from('client_branches')
          .select('id')
          .eq('id', branch_id)
          .eq('user_id', req.user!.id)
          .eq('client_id', client_id)
          .maybeSingle()

        if (branchErr || !branch) {
          sendSupabaseError(res, 400, branchErr, 'Sucursal inválida')
          return
        }
      }

      const payload = {
        user_id: req.user!.id,
        client_id,
        branch_id: branch_id ?? null,
        service_date,
        start_time: req.body?.start_time ? String(req.body.start_time) : null,
        origin: req.body?.origin ? String(req.body.origin) : null,
        destination: req.body?.destination ? String(req.body.destination) : null,
        service_type: req.body?.service_type ? String(req.body.service_type) : null,
        status,
        vehicle_id: req.body?.vehicle_id ? String(req.body.vehicle_id) : null,
        driver_id: req.body?.driver_id ? String(req.body.driver_id) : null,
        agreed_amount: req.body?.agreed_amount != null ? Number(req.body.agreed_amount) : null,
        notes: req.body?.notes ? String(req.body.notes) : null,
        started_at: req.body?.started_at ? String(req.body.started_at) : null,
        completed_at: req.body?.completed_at ? String(req.body.completed_at) : null,
      }
      const { data, error } = await supabase.from('services').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear el servicio')
        return
      }
      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const nextClientId = req.body?.client_id != null ? String(req.body.client_id) : undefined
      const branchRaw = req.body?.branch_id != null ? String(req.body.branch_id) : undefined
      const branchIdToSet =
        branchRaw === undefined
          ? (nextClientId != null ? null : undefined)
          : branchRaw.trim()
            ? branchRaw.trim()
            : null

      let effectiveClientId: string | null = nextClientId ?? null
      if (branchIdToSet && typeof branchIdToSet === 'string' && !effectiveClientId) {
        const { data: existing, error: existingErr } = await supabase
          .from('services')
          .select('client_id')
          .eq('id', id)
          .eq('user_id', req.user!.id)
          .maybeSingle()

        if (existingErr) {
          sendSupabaseError(res, 400, existingErr, 'Servicio inválido')
          return
        }

        if (!existing) {
          res.status(404).json({ success: false, error: 'Servicio no encontrado' })
          return
        }

        effectiveClientId = String(existing.client_id)
      }

      if (branchIdToSet && typeof branchIdToSet === 'string') {
        const { data: branch, error: branchErr } = await supabase
          .from('client_branches')
          .select('id')
          .eq('id', branchIdToSet)
          .eq('user_id', req.user!.id)
          .eq('client_id', effectiveClientId ?? '')
          .maybeSingle()

        if (branchErr || !branch) {
          sendSupabaseError(res, 400, branchErr, 'Sucursal inválida')
          return
        }
      }

      const patch = {
        client_id: nextClientId,
        branch_id: branchIdToSet,
        service_date: req.body?.service_date != null ? String(req.body.service_date).slice(0, 10) : undefined,
        start_time: req.body?.start_time != null ? String(req.body.start_time) : undefined,
        origin: req.body?.origin != null ? String(req.body.origin) : undefined,
        destination: req.body?.destination != null ? String(req.body.destination) : undefined,
        service_type: req.body?.service_type != null ? String(req.body.service_type) : undefined,
        status: req.body?.status != null ? String(req.body.status) : undefined,
        vehicle_id: req.body?.vehicle_id != null ? String(req.body.vehicle_id) : undefined,
        driver_id: req.body?.driver_id != null ? String(req.body.driver_id) : undefined,
        agreed_amount: req.body?.agreed_amount != null ? Number(req.body.agreed_amount) : undefined,
        notes: req.body?.notes != null ? String(req.body.notes) : undefined,
        started_at: req.body?.started_at != null ? String(req.body.started_at) : undefined,
        completed_at: req.body?.completed_at != null ? String(req.body.completed_at) : undefined,
      }
      const { data, error } = await supabase
        .from('services')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()
      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar el servicio')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Servicio no encontrado' })
        return
      }
      res.status(200).json({ success: true, data })
    })()
  })
})

router.get('/unbilled/completed', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data: invoices, error: invErr } = await supabase
        .from('invoices')
        .select('service_id')
        .eq('user_id', req.user!.id)
        .not('service_id', 'is', null)

      if (invErr) {
        sendSupabaseError(res, 500, invErr, 'No se pudieron cargar facturas')
        return
      }

      const billedServiceIds = new Set((invoices ?? []).map(i => i.service_id).filter(Boolean) as string[])
      const { data: services, error: svcErr } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', req.user!.id)
        .eq('status', 'completado')
        .order('service_date', { ascending: false })

      if (svcErr) {
        sendSupabaseError(res, 500, svcErr, 'No se pudieron cargar servicios')
        return
      }

      const data = (services ?? []).filter(s => !billedServiceIds.has(String(s.id)))
      res.status(200).json({ success: true, data })
    })()
  })
})

export default router
