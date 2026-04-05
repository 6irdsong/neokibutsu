import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import { formatDatetime } from '@/lib/format'

export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}))
  const deviceId = data.device_id

  if (!(await isAdmin())) {
    return NextResponse.json({
      status: 'error',
      message: '管理者権限がありません。',
    }, { status: 403 })
  }

  if (typeof deviceId !== 'string' || deviceId.length === 0 || deviceId.length > 200) {
    return NextResponse.json({ status: 'error', message: '無効な端末IDです。' }, { status: 400 })
  }

  const supabase = createServerClient()
  const now = new Date()
  const createdAt = formatDatetime(now)

  const { error } = await supabase.from('banned_devices').upsert({
    device_id: deviceId,
    created_at: createdAt,
  })

  if (error) {
    return NextResponse.json({ status: 'error', message: 'BAN処理に失敗しました。' }, { status: 500 })
  }

  return NextResponse.json({ status: 'success', message: `デバイス ${deviceId} を追放しました。` })
}
