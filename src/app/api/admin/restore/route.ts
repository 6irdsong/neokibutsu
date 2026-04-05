import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ status: 'error', message: '管理者権限がありません。' }, { status: 403 })
  }

  const data = await request.json().catch(() => ({}))
  const id = Number(data.id)

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ status: 'error', message: '無効な投稿IDです。' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: null })
    .eq('id', id)
    .not('deleted_at', 'is', null)

  if (error) {
    return NextResponse.json({ status: 'error', message: '復元に失敗しました。' }, { status: 500 })
  }

  return NextResponse.json({ status: 'success', message: '復元しました。' })
}
