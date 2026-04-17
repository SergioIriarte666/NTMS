import { Router, type Response } from 'express'
import { createInvoice, db, seedDb, updateInvoice, type InvoiceStatus } from '../db.js'
import { canRead, canWriteBilling, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    seedDb()
    res.status(200).json({ success: true, data: db.invoices })
  })
})

router.post('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteBilling, req, res, () => {
    seedDb()

    const client_id = String(req.body?.client_id ?? '')
    const service_id = req.body?.service_id ? String(req.body.service_id) : undefined
    const issue_date = String(req.body?.issue_date ?? new Date().toISOString().slice(0, 10)).slice(0, 10)
    const due_date = req.body?.due_date ? String(req.body.due_date).slice(0, 10) : undefined
    const invoice_number = req.body?.invoice_number ? String(req.body.invoice_number) : undefined
    const status = String(req.body?.status ?? 'emitida') as InvoiceStatus

    if (!client_id) {
      res.status(400).json({ success: false, error: 'client_id es requerido' })
      return
    }

    const allowed: InvoiceStatus[] = ['borrador', 'emitida', 'pagada', 'anulada', 'vencida']
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, error: 'Estado inválido' })
      return
    }

    const taxRate = req.body?.tax_rate != null ? Number(req.body.tax_rate) : 0.19
    const subtotal = req.body?.subtotal != null ? Number(req.body.subtotal) : undefined

    const relatedService = service_id ? db.services.find(s => s.id === service_id) : undefined
    const computedSubtotal = subtotal ?? (relatedService?.agreed_amount ?? 0)
    const tax = Math.round(computedSubtotal * taxRate)
    const total = computedSubtotal + tax

    const invoice = createInvoice({
      client_id,
      service_id,
      invoice_number,
      issue_date,
      due_date,
      subtotal: computedSubtotal,
      tax,
      total,
      status,
    })

    res.status(201).json({ success: true, data: invoice })
  })
})

router.patch('/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteBilling, req, res, () => {
    seedDb()
    const id = String(req.params.id)
    const updated = updateInvoice(id, req.body ?? {})
    if (!updated) {
      res.status(404).json({ success: false, error: 'Factura no encontrada' })
      return
    }
    res.status(200).json({ success: true, data: updated })
  })
})

export default router

