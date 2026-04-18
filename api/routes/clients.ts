import { Router, type Response } from 'express'
import { canRead, canWriteCore, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'
import { sendSupabaseError } from '../http.js'
import { getSupabaseAdmin } from '../supabase.js'

const router = Router()

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    void (async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false })

      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar los clientes')
        return
      }

      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

router.post('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const rut = String(req.body?.rut ?? '').trim()
    const razon_social = String(req.body?.razon_social ?? '').trim()

    if (!razon_social) {
      res.status(400).json({ success: false, error: 'Razón social es requerida' })
      return
    }

    void (async () => {
      const supabase = getSupabaseAdmin()
      const payload = {
        user_id: req.user!.id,
        rut,
        razon_social,
        giro: req.body?.giro ? String(req.body.giro) : null,
        direccion: req.body?.direccion ? String(req.body.direccion) : null,
        email: req.body?.email ? String(req.body.email) : null,
        telefono: req.body?.telefono ? String(req.body.telefono) : null,
        is_active: Boolean(req.body?.is_active ?? true),
        payment_terms: req.body?.payment_terms ? String(req.body.payment_terms) : null,
        notes: req.body?.notes ? String(req.body.notes) : null,
      }
      const { data, error } = await supabase.from('clients').insert(payload).select('*').single()
      if (error || !data) {
        sendSupabaseError(res, 400, error, 'No se pudo crear el cliente')
        return
      }
      res.status(201).json({ success: true, data })
    })()
  })
})

router.patch('/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canWriteCore, req, res, () => {
    const id = String(req.params.id)
    void (async () => {
      const supabase = getSupabaseAdmin()
      const patch = {
        rut: req.body?.rut != null ? String(req.body.rut).trim() : undefined,
        razon_social: req.body?.razon_social != null ? String(req.body.razon_social).trim() : undefined,
        giro: req.body?.giro != null ? String(req.body.giro) : undefined,
        direccion: req.body?.direccion != null ? String(req.body.direccion) : undefined,
        email: req.body?.email != null ? String(req.body.email) : undefined,
        telefono: req.body?.telefono != null ? String(req.body.telefono) : undefined,
        is_active: req.body?.is_active != null ? Boolean(req.body.is_active) : undefined,
        payment_terms: req.body?.payment_terms != null ? String(req.body.payment_terms) : undefined,
        notes: req.body?.notes != null ? String(req.body.notes) : undefined,
      }

      const { data, error } = await supabase
        .from('clients')
        .update(patch)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select('*')
        .single()

      if (error) {
        sendSupabaseError(res, 400, error, 'No se pudo actualizar el cliente')
        return
      }
      if (!data) {
        res.status(404).json({ success: false, error: 'Cliente no encontrado' })
        return
      }

      res.status(200).json({ success: true, data })
    })()
  })
})

export default router
