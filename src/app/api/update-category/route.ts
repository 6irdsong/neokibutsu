import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}))
  const postId = Number(data.post_id)
  const category = data.category

  if (!(await isAdmin())) {
    return NextResponse.json({ status: 'error', message: '管理者権限がありません。' }, { status: 403 })
  }

  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ status: 'error', message: '無効な投稿IDです。' }, { status: 400 })
  }
  if (!['全学教育科目', '専門科目'].includes(category)) {
    return NextResponse.json({ status: 'error', message: '無効な科目区分です。' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('posts').update({ category }).eq('id', postId)

  if (error) {
    return NextResponse.json({ status: 'error', message: '更新に失敗しました。' }, { status: 500 })
  }

  return NextResponse.json({ status: 'success', message: '科目区分を変更しました。' })
}
