/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { createSession, deleteSession, getSessionByToken, seedDb, type Role } from '../db.js'

const router = Router()

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, error: 'No implementado' })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  seedDb()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const role = String(req.body?.role ?? '') as Role

  const allowedRoles: Role[] = ['admin', 'operaciones', 'facturacion', 'consulta']
  if (!email || !email.includes('@') || password.length < 1 || !allowedRoles.includes(role)) {
    res.status(400).json({ success: false, error: 'Credenciales inválidas' })
    return
  }

  const session = createSession({ email, role })
  res.status(200).json({
    success: true,
    token: session.token,
    user: session.user,
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const auth = String(req.headers.authorization ?? '')
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined
  if (token) deleteSession(token)
  res.status(200).json({ success: true })
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const auth = String(req.headers.authorization ?? '')
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined
  if (!token) {
    res.status(401).json({ success: false, error: 'No autorizado' })
    return
  }
  const session = getSessionByToken(token)
  if (!session) {
    res.status(401).json({ success: false, error: 'Sesión inválida' })
    return
  }
  res.status(200).json({ success: true, user: session.user })
})

export default router
