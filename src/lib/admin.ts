import { createAuthServerClient } from '@/lib/supabase-server'

export async function isAdmin(): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  if (adminEmails.length === 0) return false
  const supabaseAuth = await createAuthServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  return !!user?.email && adminEmails.includes(user.email)
}
