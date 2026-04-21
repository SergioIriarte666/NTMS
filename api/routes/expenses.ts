import { Router, type Response } from 'express'
import { canRead, canWriteCore, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'
import { sendSupabaseError } from '../http.js'
import { getSupabaseAdmin } from '../supabase.js'

type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro'

const router = Router()

router.get('/categories', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('name', { ascending: true })

      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar las categorías')
        return
      }

      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/categories', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const name = String(req.body?.name ?? '').trim()
    if (!name) {
      res.status(400).json({ success: false, error: 'Nombre es requerido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const payload = { user_id: req.user!.id, name, is_active: Boolean(req.body?.is_active ?? true) }
      const { data, error } = await supabase.from('expense_categories').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear la categoría')
        return
      }
      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/categories/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    const patch = {
      name: req.body?.name != null ? String(req.body.name).trim() : undefined,
      is_active: req.body?.is_active != null ? Boolean(req.body.is_active) : undefined,
    }
    if (patch.name != null && patch.name.length === 0) {
      res.status(400).json({ success: false, error: 'Nombre es requerido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('expense_categories')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar la categoría')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Categoría no encontrada' })
        return
      }

      res.status(200).json({ success: true, data })
    })()
  })
})

router.delete('/categories/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user!.id)

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo eliminar la categoría')
        return
      }

      res.status(200).json({ success: true })
    })()
  })
})

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const startDate = req.query?.start_date ? String(req.query.start_date).slice(0, 10) : null
      const endDate = req.query?.end_date ? String(req.query.end_date).slice(0, 10) : null
      const categoryId = req.query?.category_id ? String(req.query.category_id) : null
      const providerId = req.query?.provider_id ? String(req.query.provider_id) : null
      const paymentMethod = req.query?.payment_method ? (String(req.query.payment_method) as PaymentMethod) : null

      const supabase = getSupabaseAdmin()
      let q = supabase
        .from('expenses')
        .select('*, category:expense_categories(id, name), provider:providers(id, razon_social)')
        .eq('user_id', req.user!.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (startDate) q = q.gte('expense_date', startDate)
      if (endDate) q = q.lte('expense_date', endDate)
      if (categoryId) q = q.eq('category_id', categoryId)
      if (providerId) q = q.eq('provider_id', providerId)
      if (paymentMethod) q = q.eq('payment_method', paymentMethod)

      const { data, error } = await q
      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar los gastos')
        return
      }

      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const category_id = String(req.body?.category_id ?? '').trim()
    const expense_date = String(req.body?.expense_date ?? '').slice(0, 10)
    const amount = Number(req.body?.amount)
    const payment_method = String(req.body?.payment_method ?? '').trim() as PaymentMethod

    if (!category_id) {
      res.status(400).json({ success: false, error: 'Categoría es requerida' })
      return
    }
    if (!expense_date) {
      res.status(400).json({ success: false, error: 'Fecha es requerida' })
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ success: false, error: 'Monto inválido' })
      return
    }
    if (!['efectivo', 'transferencia', 'tarjeta', 'otro'].includes(payment_method)) {
      res.status(400).json({ success: false, error: 'Medio de pago inválido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const payload: {
        user_id: string
        category_id: string
        expense_date: string
        amount: number
        payment_method: PaymentMethod
        provider_id?: string | null
        attachment_url?: string | null
        notes?: string | null
      } = {
        user_id: req.user!.id,
        category_id,
        expense_date,
        amount,
        payment_method,
      }

      if (req.body?.provider_id) payload.provider_id = String(req.body.provider_id)
      if (req.body?.attachment_url) payload.attachment_url = String(req.body.attachment_url)
      if (req.body?.notes) payload.notes = String(req.body.notes)

      const { data, error } = await supabase.from('expenses').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear el gasto')
        return
      }

      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    const patch: {
      category_id?: string
      expense_date?: string
      amount?: number
      payment_method?: PaymentMethod
      provider_id?: string | null
      attachment_url?: string | null
      notes?: string | null
    } = {}

    if (req.body?.category_id != null) {
      const v = String(req.body.category_id).trim()
      if (!v) {
        res.status(400).json({ success: false, error: 'Categoría es requerida' })
        return
      }
      patch.category_id = v
    }
    if (req.body?.expense_date != null) {
      const v = String(req.body.expense_date).slice(0, 10)
      if (!v) {
        res.status(400).json({ success: false, error: 'Fecha es requerida' })
        return
      }
      patch.expense_date = v
    }
    if (req.body?.amount != null) {
      const v = Number(req.body.amount)
      if (!Number.isFinite(v) || v <= 0) {
        res.status(400).json({ success: false, error: 'Monto inválido' })
        return
      }
      patch.amount = v
    }
    if (req.body?.payment_method != null) {
      const v = String(req.body.payment_method).trim() as PaymentMethod
      if (!['efectivo', 'transferencia', 'tarjeta', 'otro'].includes(v)) {
        res.status(400).json({ success: false, error: 'Medio de pago inválido' })
        return
      }
      patch.payment_method = v
    }

    if (req.body?.provider_id != null) {
      patch.provider_id = String(req.body.provider_id).length === 0 ? null : String(req.body.provider_id)
    }
    if (req.body?.attachment_url != null) {
      patch.attachment_url = String(req.body.attachment_url).length === 0 ? null : String(req.body.attachment_url)
    }
    if (req.body?.notes != null) {
      patch.notes = String(req.body.notes).length === 0 ? null : String(req.body.notes)
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('expenses')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar el gasto')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Gasto no encontrado' })
        return
      }

      res.status(200).json({ success: true, data })
    })()
  })
})

router.delete('/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user!.id)

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo eliminar el gasto')
        return
      }

      res.status(200).json({ success: true })
    })()
  })
})

export default router

