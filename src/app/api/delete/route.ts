import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}))
  const postId = Number(data.id)

  if (!(await isAdmin())) {
    return NextResponse.json({
      status: 'error',
      message: '管理者権限がありません。',
    }, { status: 403 })
  }

  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ status: 'error', message: '無効な投稿IDです。' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', postId).is('deleted_at', null)

  if (error) {
    return NextResponse.json({ status: 'error', message: '削除に失敗しました。' }, { status: 500 })
  }

  return NextResponse.json({ status: 'success', message: '削除が完了しました。' })
}
