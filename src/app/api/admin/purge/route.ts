import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ status: 'error', message: '管理者権限がありません。' }, { status: 403 })
  }

  const supabase = createServerClient()
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('posts')
    .delete()
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff)
    .select('id')

  if (error) {
    console.error(error)
    return NextResponse.json({ status: 'error', message: '削除に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ status: 'success', purged: data?.length || 0 })
}
