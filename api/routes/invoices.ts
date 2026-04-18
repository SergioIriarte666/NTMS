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
    const branch_id_raw = req.body?.branch_id != null ? String(req.body.branch_id) : undefined
    const branch_id = branch_id_raw && branch_id_raw.trim() ? branch_id_raw.trim() : undefined
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
      let serviceClientId: string | null = null
      let serviceBranchId: string | null = null
      if (service_id) {
        const svc = await supabase
          .from('services')
          .select('agreed_amount, client_id, branch_id')
          .eq('id', service_id)
          .eq('user_id', req.user!.id)
          .single()
        if (svc.error) {
          sendSupabaseError(res, 400, svc.error, 'Servicio inválido')
          return
        }
        serviceSubtotal = Number(svc.data?.agreed_amount ?? 0)
        serviceClientId = svc.data?.client_id ? String(svc.data.client_id) : null
        serviceBranchId = svc.data?.branch_id ? String(svc.data.branch_id) : null

        if (serviceClientId && serviceClientId !== client_id) {
          res.status(400).json({ success: false, error: 'client_id no coincide con el servicio' })
          return
        }
      }

      if (!service_id && branch_id) {
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

      const computedSubtotal = subtotal ?? serviceSubtotal
      const tax = Math.round(computedSubtotal * taxRate)
      const total = computedSubtotal + tax

      const payload = {
        user_id: req.user!.id,
        client_id,
        service_id: service_id ?? null,
        branch_id: service_id ? serviceBranchId : (branch_id ?? null),
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
      const nextClientId = req.body?.client_id != null ? String(req.body.client_id) : undefined
      const branchRaw = req.body?.branch_id != null ? String(req.body.branch_id) : undefined
      const branchIdToSet =
        branchRaw === undefined
          ? (nextClientId != null ? null : undefined)
          : branchRaw.trim()
            ? branchRaw.trim()
            : null

      if (branchIdToSet && typeof branchIdToSet === 'string') {
        let clientIdForBranch = nextClientId
        if (!clientIdForBranch) {
          const { data: inv, error: invErr } = await supabase
            .from('invoices')
            .select('client_id')
            .eq('id', id)
            .eq('user_id', req.user!.id)
            .maybeSingle()

          if (invErr) {
            sendSupabaseError(res, 400, invErr, 'Factura inválida')
            return
          }
          if (!inv) {
            res.status(404).json({ success: false, error: 'Factura no encontrada' })
            return
          }
          clientIdForBranch = String(inv.client_id)
        }

        const { data: branch, error: branchErr } = await supabase
          .from('client_branches')
          .select('id')
          .eq('id', branchIdToSet)
          .eq('user_id', req.user!.id)
          .eq('client_id', clientIdForBranch)
          .maybeSingle()

        if (branchErr || !branch) {
          sendSupabaseError(res, 400, branchErr, 'Sucursal inválida')
          return
        }
      }

      const patch = {
        client_id: nextClientId,
        service_id: req.body?.service_id != null ? String(req.body.service_id) : undefined,
        branch_id: branchIdToSet,
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
