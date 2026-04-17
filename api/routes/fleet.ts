import { Router, type Response } from 'express'
import {
  createDriver,
  createVehicle,
  db,
  seedDb,
  updateDriver,
  updateVehicle,
  type DriverStatus,
  type VehicleStatus,
} from '../db.js'
import { canRead, canWriteCore, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

router.get('/vehicles', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    seedDb()
    res.status(200).json({ success: true, data: db.vehicles })
  })
})

router.post('/vehicles', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    seedDb()
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

    const vehicle = createVehicle({
      patente,
      tipo: req.body?.tipo ? String(req.body.tipo) : undefined,
      capacidad: req.body?.capacidad ? String(req.body.capacidad) : undefined,
      status,
      is_active: Boolean(req.body?.is_active ?? true),
    })

    res.status(201).json({ success: true, data: vehicle })
  })
})

router.patch('/vehicles/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    seedDb()
    const id = String(req.params.id)
    const updated = updateVehicle(id, req.body ?? {})
    if (!updated) {
      res.status(404).json({ success: false, error: 'Grúa no encontrada' })
      return
    }
    res.status(200).json({ success: true, data: updated })
  })
})

router.get('/drivers', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    seedDb()
    res.status(200).json({ success: true, data: db.drivers })
  })
})

router.post('/drivers', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    seedDb()
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

    const driver = createDriver({
      rut,
      nombre,
      licencia_clase: req.body?.licencia_clase ? String(req.body.licencia_clase) : undefined,
      telefono: req.body?.telefono ? String(req.body.telefono) : undefined,
      status,
      is_active: Boolean(req.body?.is_active ?? true),
    })

    res.status(201).json({ success: true, data: driver })
  })
})

router.patch('/drivers/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    seedDb()
    const id = String(req.params.id)
    const updated = updateDriver(id, req.body ?? {})
    if (!updated) {
      res.status(404).json({ success: false, error: 'Chofer no encontrado' })
      return
    }
    res.status(200).json({ success: true, data: updated })
  })
})

export default router

