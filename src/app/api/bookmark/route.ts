import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'
import { getAnonymousId } from '@/lib/anonymous-id'

async function getAuthUser() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ status: 'error', message: 'ログインが必要です' }, { status: 401 })
  }

  const anonymousId = getAnonymousId(user.id)
  const body = await request.json().catch(() => ({}))
  const postId = Number(body.post_id)
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ status: 'error', message: '投稿IDが必要です' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { count } = await supabase
    .from('post_bookmarks')
    .delete({ count: 'exact' })
    .eq('post_id', postId)
    .eq('anonymous_id', anonymousId)

  if (count && count > 0) {
    return NextResponse.json({ status: 'success', bookmarked: false })
  }

  const { error } = await supabase
    .from('post_bookmarks')
    .insert({ post_id: postId, anonymous_id: anonymousId })

  if (error) {
    console.error(error)
    return NextResponse.json({ status: 'error', message: '処理に失敗しました' }, { status: 500 })
  }
  return NextResponse.json({ status: 'success', bookmarked: true })
}

export async function GET(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ bookmarked_post_ids: [] })
  }

  const anonymousId = getAnonymousId(user.id)
  const { searchParams } = new URL(request.url)
  const postIds = searchParams.get('post_ids')?.split(',').map(Number).filter(Boolean) || []

  const supabase = createServerClient()

  if (postIds.length === 0) {
    // Return all bookmarks (for /bookmarks page)
    const { data } = await supabase
      .from('post_bookmarks')
      .select('post_id')
      .eq('anonymous_id', anonymousId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      bookmarked_post_ids: (data || []).map(r => r.post_id),
    })
  }

  const { data } = await supabase
    .from('post_bookmarks')
    .select('post_id')
    .eq('anonymous_id', anonymousId)
    .in('post_id', postIds)

  return NextResponse.json({
    bookmarked_post_ids: (data || []).map(r => r.post_id),
  })
}
