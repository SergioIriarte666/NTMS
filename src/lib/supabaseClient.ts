import { createClient } from '@supabase/supabase-js'

const url = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim() || 'http://localhost:54321'
const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim() || 'anon'

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
