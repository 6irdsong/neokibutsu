import crypto from 'crypto'
import { createAuthServerClient } from '@/lib/supabase-server'

const SALT = process.env.SECRET_KEY || 'default-salt'

export function getAnonymousId(userId: string): string {
  return crypto.createHash('sha256').update(userId + SALT).digest('hex')
}

// Returns anonymous_id if user is logged in, null otherwise
export async function getAnonymousIdFromSession(): Promise<string | null> {
  try {
    const supabase = await createAuthServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return getAnonymousId(user.id)
  } catch {
    return null
  }
}
