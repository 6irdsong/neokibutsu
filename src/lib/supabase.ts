import { createClient } from '@supabase/supabase-js'
import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(supabaseUrl, serviceRoleKey)
}

export function createPublicServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export function createBrowserClient() {
  return createSSRBrowserClient(supabaseUrl, supabaseAnonKey)
}
