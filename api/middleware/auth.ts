import type { Request, Response, NextFunction } from 'express'
import type { Role } from '../db.js'
import { getSessionByToken } from '../db.js'

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

  const session = getSessionByToken(token)
  if (!session || !session.user.is_active) {
    res.status(401).json({ success: false, error: 'Sesión inválida' })
    return
  }

  req.user = session.user
  next()
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

