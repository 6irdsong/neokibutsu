import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getDeviceId } from '@/lib/device-id'
import { sendTelegram } from '@/lib/telegram'
import { formatDatetime } from '@/lib/format'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}))
  const message = (typeof data.message === 'string' ? data.message : '').trim()
  const deviceId = await getDeviceId()

  if (!message || message.length > 5000) {
    return NextResponse.json({ status: 'error', message: !message ? 'メッセージが空です' : 'メッセージが長すぎます' }, { status: 400 })
  }

  const supabase = createServerClient()

  if (deviceId) {
    if (await isRateLimited(supabase, 'reports', 'reporter_device_id', deviceId, 60000, { subject: '管理者への連絡' })) {
      return NextResponse.json({ status: 'error', message: '連続送信はできません。1分後に再試行してください。' }, { status: 429 })
    }
  }

  const now = new Date()
  const createdAt = formatDatetime(now)

  const { error } = await supabase.from('reports').insert({
    post_id: 0,
    subject: '管理者への連絡',
    reason: message,
    reporter_device_id: deviceId,
    status: 'pending',
    created_at: createdAt,
  })

  if (error) {
    console.error(error)
    return NextResponse.json({ status: 'error', message: '保存に失敗しました。再度お試しください' }, { status: 500 })
  }

  await sendTelegram(
    `📩 **管理者への連絡** 📩\n\n` +
    `**メッセージ:** ${message}\n\n` +
    `**DeviceID:** ${deviceId}`
  )

  return NextResponse.json({ status: 'success', message: '送信しました' })
}
