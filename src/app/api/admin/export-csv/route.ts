import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ status: 'error', message: '管理者権限がありません' }, { status: 403 })
  }

  const MAX_EXPORT_ROWS = 10000

  const supabase = createServerClient()
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .is('deleted_at', null)
    .order('id', { ascending: false })
    .limit(MAX_EXPORT_ROWS)

  if (error || !posts) {
    return NextResponse.json({ status: 'error', message: 'DB Error' }, { status: 500 })
  }

  // Build CSV with BOM for Excel
  const header = ['ID', '講義名', '教員名', '評価', 'テスト', '課題', 'レポート', '出席', 'コメント', '投稿日時', '投稿者', 'IP', 'DeviceID', '科目区分']

  function escapeCSV(val: string | null | undefined): string {
    if (val == null) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const rows = posts.map(p => [
    p.id, p.subject, p.teacher, p.rating, p.test, p.assignment,
    p.report, p.attendance, p.comment, p.date, p.author, p.ip,
    p.device_id, p.category || '全学教育科目'
  ].map(v => escapeCSV(v as string)).join(','))

  const csv = '\uFEFF' + header.join(',') + '\n' + rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=neokibutsu_export.csv',
    },
  })
}
