import { Router, type Response } from 'express'
import { type InvoiceStatus } from '../db.js'
import { canRead, canWriteBilling, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'
import { sendSupabaseError } from '../http.js'
import { getSupabaseAdmin } from '../supabase.js'

const router = Router()

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('issue_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar las facturas')
        return
      }
      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteBilling, req, res, () => {
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

    void (async () => {
      const supabase = getSupabaseAdmin()

      let serviceSubtotal = 0
      if (service_id) {
        const svc = await supabase
          .from('services')
          .select('agreed_amount')
          .eq('id', service_id)
          .eq('user_id', req.user!.id)
          .single()
        if (svc.error) {
          sendSupabaseError(res, 400, svc.error, 'Servicio inválido')
          return
        }
        serviceSubtotal = Number(svc.data?.agreed_amount ?? 0)
      }

      const computedSubtotal = subtotal ?? serviceSubtotal
      const tax = Math.round(computedSubtotal * taxRate)
      const total = computedSubtotal + tax

      const payload = {
        user_id: req.user!.id,
        client_id,
        service_id: service_id ?? null,
        invoice_number: invoice_number ?? null,
        issue_date,
        due_date: due_date ?? null,
        subtotal: computedSubtotal,
        tax,
        total,
        status,
      }

      const { data, error } = await supabase.from('invoices').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear la factura')
        return
      }
      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteBilling, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const patch = {
        client_id: req.body?.client_id != null ? String(req.body.client_id) : undefined,
        service_id: req.body?.service_id != null ? String(req.body.service_id) : undefined,
        invoice_number: req.body?.invoice_number != null ? String(req.body.invoice_number) : undefined,
        issue_date: req.body?.issue_date != null ? String(req.body.issue_date).slice(0, 10) : undefined,
        due_date: req.body?.due_date != null ? String(req.body.due_date).slice(0, 10) : undefined,
        subtotal: req.body?.subtotal != null ? Number(req.body.subtotal) : undefined,
        tax: req.body?.tax != null ? Number(req.body.tax) : undefined,
        total: req.body?.total != null ? Number(req.body.total) : undefined,
        status: req.body?.status != null ? String(req.body.status) : undefined,
      }
      const { data, error } = await supabase
        .from('invoices')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar la factura')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Factura no encontrada' })
        return
      }
      res.status(200).json({ success: true, data })
    })()
  })
})

export default router
