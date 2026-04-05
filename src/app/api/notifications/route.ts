import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getDeviceId } from '@/lib/device-id'
import { getAnonymousIdFromSession } from '@/lib/anonymous-id'

export async function GET() {
  const deviceId = await getDeviceId()
  const anonymousId = await getAnonymousIdFromSession()

  if (!deviceId && !anonymousId) return NextResponse.json([])

  const supabase = createServerClient()

  // Query by anonymous_id (account-based) or device_id (anonymous)
  if (anonymousId) {
    const { data } = await supabase
      .from('notifications')
      .select('id, message, created_at')
      .eq('anonymous_id', anonymousId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    // Also fetch device_id notifications (from before login)
    if (deviceId) {
      const { data: deviceData } = await supabase
        .from('notifications')
        .select('id, message, created_at')
        .eq('device_id', deviceId)
        .is('anonymous_id', null)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      const all = [...(data || []), ...(deviceData || [])]
      all.sort((a, b) => b.created_at.localeCompare(a.created_at))
      return NextResponse.json(all)
    }

    return NextResponse.json(data || [])
  }

  // Not logged in: device_id only
  const { data, error } = await supabase
    .from('notifications')
    .select('id, message, created_at')
    .eq('device_id', deviceId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json([])
  return NextResponse.json(data || [])
}
