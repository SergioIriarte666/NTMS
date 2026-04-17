import { Router, type Response } from 'express'
import { createClient, db, seedDb, updateClient } from '../db.js'
import { canRead, canWriteCore, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    seedDb()
    res.status(200).json({ success: true, data: db.clients })
  })
})

router.post('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    seedDb()
    const rut = String(req.body?.rut ?? '').trim()
    const razon_social = String(req.body?.razon_social ?? '').trim()

    if (!razon_social) {
      res.status(400).json({ success: false, error: 'Razón social es requerida' })
      return
    }

    const client = createClient({
      rut,
      razon_social,
      giro: req.body?.giro ? String(req.body.giro) : undefined,
      direccion: req.body?.direccion ? String(req.body.direccion) : undefined,
      email: req.body?.email ? String(req.body.email) : undefined,
      telefono: req.body?.telefono ? String(req.body.telefono) : undefined,
      is_active: Boolean(req.body?.is_active ?? true),
      payment_terms: req.body?.payment_terms ? String(req.body.payment_terms) : undefined,
      notes: req.body?.notes ? String(req.body.notes) : undefined,
    })

    res.status(201).json({ success: true, data: client })
  })
})

router.patch('/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    seedDb()
    const id = String(req.params.id)
    const updated = updateClient(id, req.body ?? {})
    if (!updated) {
      res.status(404).json({ success: false, error: 'Cliente no encontrado' })
      return
    }
    res.status(200).json({ success: true, data: updated })
  })
})

export default router

