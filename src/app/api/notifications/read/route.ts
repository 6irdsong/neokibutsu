import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getDeviceId } from '@/lib/device-id'
import { getAnonymousIdFromSession } from '@/lib/anonymous-id'

export async function POST() {
  const deviceId = await getDeviceId()
  const anonymousId = await getAnonymousIdFromSession()

  if (!deviceId && !anonymousId) {
    return NextResponse.json({ status: 'error' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Mark account-based notifications as read
  if (anonymousId) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('anonymous_id', anonymousId)
      .eq('is_read', false)
  }

  // Mark device-based notifications as read
  if (deviceId) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('device_id', deviceId)
      .is('anonymous_id', null)
      .eq('is_read', false)
  }

  return NextResponse.json({ status: 'success' })
}
