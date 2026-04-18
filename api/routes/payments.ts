import { Router, type Response } from 'express'
import { canRead, canWriteBilling, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'
import { sendSupabaseError } from '../http.js'
import { getSupabaseAdmin } from '../supabase.js'

const router = Router()

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('paid_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar los pagos')
        return
      }
      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteBilling, req, res, () => {
    const invoice_id = String(req.body?.invoice_id ?? '')
    const paid_date = String(req.body?.paid_date ?? new Date().toISOString().slice(0, 10)).slice(0, 10)
    const amount = Number(req.body?.amount ?? NaN)

    if (!invoice_id || Number.isNaN(amount) || amount <= 0) {
      res.status(400).json({ success: false, error: 'invoice_id y amount son requeridos' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const invoice = await supabase
        .from('invoices')
        .select('id,total,status')
        .eq('id', invoice_id)
        .eq('user_id', req.user!.id)
        .single()

      if (invoice.error || !invoice.data) {
        res.status(404).json({ success: false, error: 'Factura no encontrada' })
        return
      }

      const payload = {
        user_id: req.user!.id,
        invoice_id,
        paid_date,
        method: req.body?.method ? String(req.body.method) : null,
        amount,
        reference: req.body?.reference ? String(req.body.reference) : null,
      }

      const inserted = await supabase.from('payments').insert(payload).select('*').single()
      if (inserted.error || !inserted.data) {
        sendSupabaseError(res, 400, inserted.error, 'No se pudo crear el pago')
        return
      }

      const payments = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', invoice_id)
        .eq('user_id', req.user!.id)

      if (payments.error) {
        sendSupabaseError(res, 500, payments.error, 'No se pudieron recalcular los pagos')
        return
      }

      const paidSum = (payments.data ?? []).reduce((acc, p) => acc + Number(p.amount ?? 0), 0)

      if (paidSum >= Number(invoice.data.total ?? 0) && invoice.data.status !== 'pagada') {
        await supabase
          .from('invoices')
          .update({ status: 'pagada' })
          .eq('id', invoice_id)
          .eq('user_id', req.user!.id)
      }

      res.status(201).json({ success: true, data: inserted.data })
    })()
  })
})

export default router
