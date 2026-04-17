import { Router, type Response } from 'express'
import { createService, db, seedDb, updateService, type ServiceStatus } from '../db.js'
import { canRead, canWriteCore, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    seedDb()

    const status = req.query.status ? String(req.query.status) : undefined
    const date = req.query.date ? String(req.query.date) : undefined

    let data = db.services
    if (status) data = data.filter(s => s.status === (status as ServiceStatus))
    if (date) data = data.filter(s => s.service_date === date)

    res.status(200).json({ success: true, data })
  })
})

router.post('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    seedDb()
    const client_id = String(req.body?.client_id ?? '')
    const service_date = String(req.body?.service_date ?? '').slice(0, 10)
    const status = String(req.body?.status ?? 'pendiente') as ServiceStatus

    if (!client_id || !service_date) {
      res.status(400).json({ success: false, error: 'client_id y service_date son requeridos' })
      return
    }

    const allowed: ServiceStatus[] = ['pendiente', 'asignado', 'en_curso', 'completado', 'cancelado']
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, error: 'Estado inválido' })
      return
    }

    const service = createService({
      client_id,
      service_date,
      start_time: req.body?.start_time ? String(req.body.start_time) : undefined,
      origin: req.body?.origin ? String(req.body.origin) : undefined,
      destination: req.body?.destination ? String(req.body.destination) : undefined,
      service_type: req.body?.service_type ? String(req.body.service_type) : undefined,
      status,
      vehicle_id: req.body?.vehicle_id ? String(req.body.vehicle_id) : undefined,
      driver_id: req.body?.driver_id ? String(req.body.driver_id) : undefined,
      agreed_amount: req.body?.agreed_amount != null ? Number(req.body.agreed_amount) : undefined,
      notes: req.body?.notes ? String(req.body.notes) : undefined,
      started_at: req.body?.started_at ? String(req.body.started_at) : undefined,
      completed_at: req.body?.completed_at ? String(req.body.completed_at) : undefined,
    })

    res.status(201).json({ success: true, data: service })
  })
})

router.patch('/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    seedDb()
    const id = String(req.params.id)
    const updated = updateService(id, req.body ?? {})
    if (!updated) {
      res.status(404).json({ success: false, error: 'Servicio no encontrado' })
      return
    }
    res.status(200).json({ success: true, data: updated })
  })
})

router.get('/unbilled/completed', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    seedDb()
    const billedServiceIds = new Set(db.invoices.map(i => i.service_id).filter(Boolean) as string[])
    const data = db.services.filter(s => s.status === 'completado' && !billedServiceIds.has(s.id))
    res.status(200).json({ success: true, data })
  })
})

export default router

