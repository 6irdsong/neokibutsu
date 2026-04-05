import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ status: 'error', message: '管理者権限がありません' }, { status: 403 })
  }

  const data = await request.json().catch(() => ({}))
  const deviceId = data.device_id

  if (typeof deviceId !== 'string' || deviceId.length === 0 || deviceId.length > 200) {
    return NextResponse.json({ status: 'error', message: '無効な端末IDです' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('banned_devices').delete().eq('device_id', deviceId)

  if (error) {
    return NextResponse.json({ status: 'error', message: '解除に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ status: 'success', message: `ID: ${deviceId} の追放を解除しました。` })
}
