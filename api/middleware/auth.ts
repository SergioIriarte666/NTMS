import type { Request, Response, NextFunction } from 'express'
import type { Role } from '../db.js'
import { getSupabaseAdmin } from '../supabase.js'

export type AuthedRequest = Request & {
  user?: {
    id: string
    email: string
    full_name: string
    role: Role
    is_active: boolean
  }
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined
  if (!token) {
    res.status(401).json({ success: false, error: 'No autorizado' })
    return
  }

  void (async () => {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      res.status(401).json({ success: false, error: 'Sesión inválida' })
      return
    }

    const roleRaw = data.user.user_metadata?.role
    const allowedRoles: Role[] = ['admin', 'operaciones', 'facturacion', 'consulta']
    const role = allowedRoles.includes(roleRaw) ? (roleRaw as Role) : process.env.NODE_ENV === 'production' ? 'consulta' : 'admin'

    req.user = {
      id: data.user.id,
      email: String(data.user.email ?? ''),
      full_name: String(data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? ''),
      role,
      is_active: data.user.user_metadata?.is_active === false ? false : true,
    }

    if (!req.user.is_active) {
      res.status(401).json({ success: false, error: 'Sesión inválida' })
      return
    }

    next()
  })()
}

export function canRead(role: Role) {
  return role === 'admin' || role === 'operaciones' || role === 'facturacion' || role === 'consulta'
}

export function canWriteCore(role: Role) {
  return role === 'admin' || role === 'operaciones'
}

export function canWriteBilling(role: Role) {
  return role === 'admin' || role === 'facturacion'
}

export function requirePermission(
  check: (role: Role) => boolean,
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const role = req.user?.role
  if (!role) {
    res.status(401).json({ success: false, error: 'No autorizado' })
    return
  }

  if (!check(role)) {
    res.status(403).json({ success: false, error: 'Prohibido' })
    return
  }
  next()
}
