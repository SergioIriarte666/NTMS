import { Router, type Response } from 'express'
import { createPayment, db, seedDb, updateInvoice } from '../db.js'
import { canRead, canWriteBilling, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    seedDb()
    res.status(200).json({ success: true, data: db.payments })
  })
})

router.post('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteBilling, req, res, () => {
    seedDb()
    const invoice_id = String(req.body?.invoice_id ?? '')
    const paid_date = String(req.body?.paid_date ?? new Date().toISOString().slice(0, 10)).slice(0, 10)
    const amount = Number(req.body?.amount ?? NaN)

    if (!invoice_id || Number.isNaN(amount) || amount <= 0) {
      res.status(400).json({ success: false, error: 'invoice_id y amount son requeridos' })
      return
    }

    const invoice = db.invoices.find(i => i.id === invoice_id)
    if (!invoice) {
      res.status(404).json({ success: false, error: 'Factura no encontrada' })
      return
    }

    const payment = createPayment({
      invoice_id,
      paid_date,
      method: req.body?.method ? String(req.body.method) : undefined,
      amount,
      reference: req.body?.reference ? String(req.body.reference) : undefined,
    })

    const paidSum = db.payments
      .filter(p => p.invoice_id === invoice_id)
      .reduce((acc, p) => acc + p.amount, 0)

    if (paidSum >= invoice.total && invoice.status !== 'pagada') {
      updateInvoice(invoice_id, { status: 'pagada' })
    }

    res.status(201).json({ success: true, data: payment })
  })
})

export default router

