import { Router, type Response } from 'express'
import { canRead, canWriteCore, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'
import { sendSupabaseError } from '../http.js'
import { getSupabaseAdmin } from '../supabase.js'

const router = Router({ mergeParams: true })

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    const clientId = String(req.params.clientId ?? '')
    if (!clientId) {
      res.status(400).json({ success: false, error: 'clientId es requerido' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('client_branches')
        .select('*')
        .eq('user_id', req.user!.id)
        .eq('client_id', clientId)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar las sucursales')
        return
      }

      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const clientId = String(req.params.clientId ?? '')
    const name = String(req.body?.name ?? '').trim()

    if (!clientId) {
      res.status(400).json({ success: false, error: 'clientId es requerido' })
      return
    }

    if (!name) {
      res.status(400).json({ success: false, error: 'name es requerido' })
      return
    }

    const is_default = Boolean(req.body?.is_default ?? false)

    void (async () => {
      const supabase = getSupabaseAdmin()
      const payload = {
        user_id: req.user!.id,
        client_id: clientId,
        name,
        direccion: req.body?.direccion ? String(req.body.direccion) : null,
        email: req.body?.email ? String(req.body.email) : null,
        telefono: req.body?.telefono ? String(req.body.telefono) : null,
        is_default,
        notes: req.body?.notes ? String(req.body.notes) : null,
      }

      const { data, error } = await supabase.from('client_branches').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear la sucursal')
        return
      }

      if (is_default) {
        await supabase
          .from('client_branches')
          .update({ is_default: false })
          .eq('user_id', req.user!.id)
          .eq('client_id', clientId)
          .neq('id', data.id)
      }

      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/:branchId', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const clientId = String(req.params.clientId ?? '')
    const branchId = String(req.params.branchId ?? '')

    if (!clientId || !branchId) {
      res.status(400).json({ success: false, error: 'clientId y branchId son requeridos' })
      return
    }

    const isDefault = req.body?.is_default != null ? Boolean(req.body.is_default) : undefined

    void (async () => {
      const supabase = getSupabaseAdmin()
      const patch = {
        name: req.body?.name != null ? String(req.body.name).trim() : undefined,
        direccion: req.body?.direccion != null ? String(req.body.direccion) : undefined,
        email: req.body?.email != null ? String(req.body.email) : undefined,
        telefono: req.body?.telefono != null ? String(req.body.telefono) : undefined,
        is_default: isDefault,
        notes: req.body?.notes != null ? String(req.body.notes) : undefined,
      }

      const { data, error } = await supabase
        .from('client_branches')
        .update(patch)
        .eq('id', branchId)
        .eq('user_id', req.user!.id)
        .eq('client_id', clientId)
        .select('*')
        .single()

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar la sucursal')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Sucursal no encontrada' })
        return
      }

      if (isDefault) {
        await supabase
          .from('client_branches')
          .update({ is_default: false })
          .eq('user_id', req.user!.id)
          .eq('client_id', clientId)
          .neq('id', data.id)
      }

      res.status(200).json({ success: true, data })
    })()
  })
})

router.delete('/:branchId', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const clientId = String(req.params.clientId ?? '')
    const branchId = String(req.params.branchId ?? '')

    if (!clientId || !branchId) {
      res.status(400).json({ success: false, error: 'clientId y branchId son requeridos' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase
        .from('client_branches')
        .delete()
        .eq('id', branchId)
        .eq('user_id', req.user!.id)
        .eq('client_id', clientId)

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo eliminar la sucursal')
        return
      }

      res.status(200).json({ success: true })
    })()
  })
})

export default router

