import { Router, type Response } from 'express'
import { canRead, canWriteCore, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'
import { sendSupabaseError } from '../http.js'
import { getSupabaseAdmin } from '../supabase.js'

type MovementType = 'ingreso' | 'egreso' | 'ajuste'

const router = Router()

router.get('/products', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('inventory_products_with_stock')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false })

      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar los productos')
        return
      }

      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/products', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const name = String(req.body?.name ?? '').trim()
    if (!name) {
      res.status(400).json({ success: false, error: 'Nombre es requerido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const skuRes = await supabase.rpc('next_product_sku', { p_user_id: req.user!.id })
      if (skuRes.error || !skuRes.data) {
        sendSupabaseError(res, 400, skuRes.error, 'No se pudo generar el SKU')
        return
      }

      const payload = {
        user_id: req.user!.id,
        sku: String(skuRes.data),
        name,
        description: req.body?.description ? String(req.body.description) : null,
        unit: req.body?.unit ? String(req.body.unit) : null,
        min_stock: req.body?.min_stock != null && String(req.body.min_stock).length > 0 ? Number(req.body.min_stock) : null,
        is_active: Boolean(req.body?.is_active ?? true),
      }

      const { data, error } = await supabase.from('inventory_products').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear el producto')
        return
      }

      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/products/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const patch = {
        name: req.body?.name != null ? String(req.body.name).trim() : undefined,
        description: req.body?.description != null ? String(req.body.description) : undefined,
        unit: req.body?.unit != null ? String(req.body.unit) : undefined,
        min_stock:
          req.body?.min_stock != null
            ? String(req.body.min_stock).length === 0
              ? null
              : Number(req.body.min_stock)
            : undefined,
        is_active: req.body?.is_active != null ? Boolean(req.body.is_active) : undefined,
      }

      const { data, error } = await supabase
        .from('inventory_products')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar el producto')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Producto no encontrado' })
        return
      }

      res.status(200).json({ success: true, data })
    })()
  })
})

router.delete('/products/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase
        .from('inventory_products')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user!.id)

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo eliminar el producto')
        return
      }

      res.status(200).json({ success: true })
    })()
  })
})

router.get('/movements', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const productId = req.query?.product_id ? String(req.query.product_id) : null
      let q = supabase
        .from('inventory_movements')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (productId) q = q.eq('product_id', productId)

      const { data, error } = await q
      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar los movimientos')
        return
      }

      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/movements', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const product_id = String(req.body?.product_id ?? '').trim()
    const movement_type = String(req.body?.movement_type ?? '').trim() as MovementType
    const quantityRaw = req.body?.quantity
    const quantity = Number(quantityRaw)

    if (!product_id) {
      res.status(400).json({ success: false, error: 'Producto es requerido' })
      return
    }
    if (!['ingreso', 'egreso', 'ajuste'].includes(movement_type)) {
      res.status(400).json({ success: false, error: 'Tipo de movimiento inválido' })
      return
    }
    if (!Number.isFinite(quantity) || quantity === 0) {
      res.status(400).json({ success: false, error: 'Cantidad inválida' })
      return
    }
    if ((movement_type === 'ingreso' || movement_type === 'egreso') && quantity < 0) {
      res.status(400).json({ success: false, error: 'Cantidad debe ser positiva' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const product = await supabase
        .from('inventory_products')
        .select('id')
        .eq('id', product_id)
        .eq('user_id', req.user!.id)
        .single()
      if (product.error || !product.data) {
        sendSupabaseError(res, 404, product.error, 'Producto no encontrado')
        return
      }

      const payload: {
        user_id: string
        product_id: string
        movement_type: MovementType
        quantity: number
        unit_cost: number | null
        reference: string | null
        notes: string | null
        movement_date?: string
      } = {
        user_id: req.user!.id,
        product_id,
        movement_type,
        quantity,
        unit_cost:
          req.body?.unit_cost != null && String(req.body.unit_cost).length > 0 ? Number(req.body.unit_cost) : null,
        reference: req.body?.reference ? String(req.body.reference) : null,
        notes: req.body?.notes ? String(req.body.notes) : null,
      }

      if (req.body?.movement_date) {
        payload.movement_date = String(req.body.movement_date).slice(0, 10)
      }

      const { data, error } = await supabase.from('inventory_movements').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo registrar el movimiento')
        return
      }

      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/movements/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const movement_type = req.body?.movement_type != null ? (String(req.body.movement_type) as MovementType) : undefined
      if (movement_type && !['ingreso', 'egreso', 'ajuste'].includes(movement_type)) {
        res.status(400).json({ success: false, error: 'Tipo de movimiento inválido' })
        return
      }

      const patch = {
        movement_type,
        quantity: req.body?.quantity != null ? Number(req.body.quantity) : undefined,
        unit_cost:
          req.body?.unit_cost != null
            ? String(req.body.unit_cost).length === 0
              ? null
              : Number(req.body.unit_cost)
            : undefined,
        reference: req.body?.reference != null ? String(req.body.reference) : undefined,
        notes: req.body?.notes != null ? String(req.body.notes) : undefined,
        movement_date: req.body?.movement_date != null ? String(req.body.movement_date).slice(0, 10) : undefined,
      }

      const { data, error } = await supabase
        .from('inventory_movements')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar el movimiento')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Movimiento no encontrado' })
        return
      }

      res.status(200).json({ success: true, data })
    })()
  })
})

router.delete('/movements/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase
        .from('inventory_movements')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user!.id)

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo eliminar el movimiento')
        return
      }

      res.status(200).json({ success: true })
    })()
  })
})

export default router
