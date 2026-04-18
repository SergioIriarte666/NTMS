import type { Response } from 'express'
import { supabaseErrorToMessage } from './supabase.js'

export function sendSupabaseError(res: Response, status: number, error: unknown, fallback: string) {
  res.status(status).json({ success: false, error: supabaseErrorToMessage(error, fallback) })
}
