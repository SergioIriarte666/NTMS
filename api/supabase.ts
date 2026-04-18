import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

type Env = {
  url: string
  anonKey: string
  serviceRoleKey: string
}

function readEnv(): Env {
  const url = String(process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '').trim()
  const anonKey = String(process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

  if (!url) throw new Error('Falta SUPABASE_URL')
  if (!anonKey) throw new Error('Falta SUPABASE_ANON_KEY')
  if (!serviceRoleKey) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY')

  return { url, anonKey, serviceRoleKey }
}

let adminClient: SupabaseClient | null = null
let anonClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient
  const env = readEnv()
  adminClient = createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return adminClient
}

export function getSupabaseAnon(): SupabaseClient {
  if (anonClient) return anonClient
  const env = readEnv()
  anonClient = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return anonClient
}

export function supabaseErrorToMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback
  const anyErr = error as { message?: unknown; code?: unknown }
  if (typeof anyErr.message === 'string' && anyErr.message.trim()) return anyErr.message
  if (typeof anyErr.code === 'string' && anyErr.code.trim()) return anyErr.code
  return fallback
}
