import { Router, type Response } from 'express'
import { canRead, canWriteCore, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'
import { sendSupabaseError } from '../http.js'
import { getSupabaseAdmin } from '../supabase.js'

const router = Router()

router.get('/brands', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('vehicle_brands')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('name', { ascending: true })

      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar las marcas')
        return
      }

      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/brands', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const name = String(req.body?.name ?? '').trim()
    if (!name) {
      res.status(400).json({ success: false, error: 'Nombre es requerido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const payload = { user_id: req.user!.id, name }
      const { data, error } = await supabase.from('vehicle_brands').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear la marca')
        return
      }
      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/brands/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    const name = req.body?.name != null ? String(req.body.name).trim() : undefined
    if (name != null && name.length === 0) {
      res.status(400).json({ success: false, error: 'Nombre es requerido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const patch = { name }
      const { data, error } = await supabase
        .from('vehicle_brands')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar la marca')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Marca no encontrada' })
        return
      }

      res.status(200).json({ success: true, data })
    })()
  })
})

router.delete('/brands/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase
        .from('vehicle_brands')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user!.id)

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo eliminar la marca')
        return
      }

      res.status(200).json({ success: true })
    })()
  })
})

router.get('/models', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const brandId = req.query?.brand_id ? String(req.query.brand_id) : null
      const supabase = getSupabaseAdmin()

      let q = supabase
        .from('vehicle_models')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('name', { ascending: true })

      if (brandId) q = q.eq('brand_id', brandId)

      const { data, error } = await q
      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar los modelos')
        return
      }

      const brandIds = Array.from(new Set((data ?? []).map(m => String(m.brand_id))))
      const brandsRes = await supabase
        .from('vehicle_brands')
        .select('id, name')
        .eq('user_id', req.user!.id)
        .in('id', brandIds.length > 0 ? brandIds : ['00000000-0000-0000-0000-000000000000'])

      const brandNameById = new Map<string, string>()
      for (const b of brandsRes.data ?? []) brandNameById.set(String(b.id), String(b.name))

      const enriched = (data ?? []).map(m => ({
        ...m,
        brand_name: brandNameById.get(String(m.brand_id)) ?? null,
      }))

      res.status(200).json({ success: true, data: enriched })
    })()
  })
})

router.post('/models', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const brand_id = String(req.body?.brand_id ?? '').trim()
    const name = String(req.body?.name ?? '').trim()

    if (!brand_id) {
      res.status(400).json({ success: false, error: 'Marca es requerida' })
      return
    }
    if (!name) {
      res.status(400).json({ success: false, error: 'Nombre es requerido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const brand = await supabase
        .from('vehicle_brands')
        .select('id')
        .eq('id', brand_id)
        .eq('user_id', req.user!.id)
        .single()

      if (brand.error || !brand.data) {
        sendSupabaseError(res, 404, brand.error, 'Marca no encontrada')
        return
      }

      const payload = { user_id: req.user!.id, brand_id, name }
      const { data, error } = await supabase.from('vehicle_models').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear el modelo')
        return
      }
      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/models/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    const patch: { brand_id?: string; name?: string } = {}

    if (req.body?.brand_id != null) {
      patch.brand_id = String(req.body.brand_id).trim()
      if (!patch.brand_id) {
        res.status(400).json({ success: false, error: 'Marca es requerida' })
        return
      }
    }
    if (req.body?.name != null) {
      patch.name = String(req.body.name).trim()
      if (!patch.name) {
        res.status(400).json({ success: false, error: 'Nombre es requerido' })
        return
      }
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      if (patch.brand_id) {
        const brand = await supabase
          .from('vehicle_brands')
          .select('id')
          .eq('id', patch.brand_id)
          .eq('user_id', req.user!.id)
          .single()
        if (brand.error || !brand.data) {
          sendSupabaseError(res, 404, brand.error, 'Marca no encontrada')
          return
        }
      }

      const { data, error } = await supabase
        .from('vehicle_models')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar el modelo')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Modelo no encontrado' })
        return
      }

      res.status(200).json({ success: true, data })
    })()
  })
})

router.delete('/models/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase
        .from('vehicle_models')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user!.id)

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo eliminar el modelo')
        return
      }

      res.status(200).json({ success: true })
    })()
  })
})

router.get('/search', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    const patente = String(req.query?.patente ?? '').trim().toUpperCase()
    if (!patente) {
      res.status(400).json({ success: false, error: 'Patente es requerida' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', req.user!.id)
        .ilike('patente', `%${patente}%`)
        .order('created_at', { ascending: false })

      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudo consultar la patente')
        return
      }

      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

export default router

