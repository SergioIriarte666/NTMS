import { Router, type Response } from 'express'
import { canRead, requireAuth, requirePermission, type AuthedRequest } from '../middleware/auth.js'
import { sendSupabaseError } from '../http.js'
import { getSupabaseAdmin } from '../supabase.js'

const router = Router()

router.get('/', requireAuth, (req: AuthedRequest, res: Response) => {
  requirePermission(canRead, req, res, () => {
    const clientId = req.query.client_id ? String(req.query.client_id) : undefined

    void (async () => {
      const supabase = getSupabaseAdmin()
      let query = supabase
        .from('client_branches')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (clientId) query = query.eq('client_id', clientId)

      const { data, error } = await query
      if (error) {
        sendSupabaseError(res, 500, error, 'No se pudieron cargar las sucursales')
        return
      }

      res.status(200).json({ success: true, data: data ?? [] })
    })()
  })
})

export default router

