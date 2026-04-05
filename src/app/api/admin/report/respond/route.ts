import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import { formatDatetime } from '@/lib/format'

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ status: 'error', message: '管理者権限がありません' }, { status: 403 })
  }

  const data = await request.json().catch(() => ({}))
  const reportId = Number(data.report_id)
  const adminResponse = data.admin_response || ''

  if (!Number.isInteger(reportId) || reportId <= 0) {
    return NextResponse.json({ status: 'error', message: '無効な通報IDです' }, { status: 400 })
  }

  const supabase = createServerClient()
  const now = new Date()
  const resolvedAt = formatDatetime(now)

  const { error: updateError } = await supabase
    .from('reports')
    .update({ status: 'resolved', admin_response: adminResponse, resolved_at: resolvedAt })
    .eq('id', reportId)

  if (updateError) {
    return NextResponse.json({ status: 'error', message: '更新に失敗しました' }, { status: 500 })
  }

  // Create notification for reporter
  const { data: report } = await supabase
    .from('reports')
    .select('reporter_device_id, reporter_anonymous_id, subject')
    .eq('id', reportId)
    .single()

  if (report?.reporter_anonymous_id) {
    let message = `ご報告いただいた「${report.subject}」を確認しました。`
    if (adminResponse) message += adminResponse

    const { error: notifError } = await supabase.from('notifications').insert({
      device_id: report.reporter_device_id || '',
      anonymous_id: report.reporter_anonymous_id,
      message,
      created_at: resolvedAt,
    })

    if (notifError) {
      console.error('Notification insert failed for report', reportId, notifError)
      return NextResponse.json({ status: 'partial', message: '通報を処理しましたが、通知の送信に失敗しました。' })
    }
  }

  return NextResponse.json({ status: 'success', message: '通報に対応しました。' })
}
