import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getDeviceId, getDeviceIdInfo, type DeviceIdInfo } from '@/lib/device-id'
import { getAnonymousIdFromSession } from '@/lib/anonymous-id'
import { sendTelegram } from '@/lib/telegram'
import { formatDatetime } from '@/lib/format'
import { isRateLimited } from '@/lib/rate-limit'

function formatDeviceLabel(anonymousId: string | null, deviceId: string, info: DeviceIdInfo | null): string {
  if (anonymousId) return `loggedin.${anonymousId.slice(0, 8)}`
  const legacy = info?.timestamp === 'legacy' ? '.legacy' : ''
  const sus = (info?.susCount || 0) > 0 ? `.sus${info!.susCount}` : ''
  return `device${legacy}.${deviceId.slice(0, 8)}${sus}`
}

export async function POST(request: Request) {
  const VALID_CATEGORIES = ['誹謗中傷', '個人情報の掲載', '虚偽の情報', 'スパム・荒らし', 'その他']

  const data = await request.json().catch(() => ({}))
  const { post_id, subject, category, reason, date, author } = data
  const reporterDeviceId = await getDeviceId()

  if (!Number.isInteger(Number(post_id)) || Number(post_id) <= 0 || !subject || !reason || !category) {
    return NextResponse.json({ status: 'error', message: '必須項目が不足しています' }, { status: 400 })
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ status: 'error', message: '無効なカテゴリです' }, { status: 400 })
  }

  const supabase = createServerClient()

  let targetDeviceId: string | null = null
  const { data: post } = await supabase
    .from('posts')
    .select('device_id')
    .eq('id', post_id)
    .single()
  if (post) targetDeviceId = post.device_id

  if (reporterDeviceId) {
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_device_id', reporterDeviceId)
      .eq('post_id', post_id)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({ status: 'error', message: 'この投稿は既に通報済みです' }, { status: 409 })
    }
  }

  if (reporterDeviceId) {
    if (await isRateLimited(supabase, 'reports', 'reporter_device_id', reporterDeviceId, 30000)) {
      return NextResponse.json({ status: 'error', message: '連続送信はできません。30秒後に再試行してください。' }, { status: 429 })
    }

    // Max 5 reports per hour
    const oneHourAgo = new Date(Date.now() - 3600000)
    const cutoff = formatDatetime(oneHourAgo)

    const { count } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('reporter_device_id', reporterDeviceId)
      .gt('created_at', cutoff)

    if (count && count >= 5) {
      return NextResponse.json({ status: 'error', message: '通報回数の上限に達しました。1時間後に再試行してください。' }, { status: 429 })
    }
  }

  const now = new Date()
  const createdAt = formatDatetime(now)

  const reporterAnonymousId = await getAnonymousIdFromSession()
  const deviceInfo = await getDeviceIdInfo()
  const susCount = deviceInfo?.susCount || 0

  const { error } = await supabase.from('reports').insert({
    post_id,
    subject,
    category,
    reason,
    reporter_device_id: reporterDeviceId,
    reporter_anonymous_id: reporterAnonymousId,
    reporter_sus_count: susCount > 0 ? susCount : null,
    reporter_device_created: deviceInfo?.timestamp || null,
    target_device_id: targetDeviceId,
    created_at: createdAt,
  })

  if (error) {
    console.error(error)
    return NextResponse.json({ status: 'error', message: '保存に失敗しました。再度お試しください' }, { status: 500 })
  }

  await sendTelegram(
    `🚨 **通報がありました** 🚨\n\n` +
    `**ID:** ${post_id}\n` +
    `**講義:** ${subject}\n` +
    `**投稿者:** ${author}\n` +
    `**投稿日:** ${date}\n` +
    `**カテゴリ:** ${category}\n` +
    `**理由:** ${reason}\n\n` +
    `**被通報者:** device.${(targetDeviceId || '').slice(0, 8)}\n` +
    `**通報者:** ${formatDeviceLabel(reporterAnonymousId, reporterDeviceId, deviceInfo)}`
  )

  return NextResponse.json({ status: 'success', message: '通報を受け付けました' })
}
