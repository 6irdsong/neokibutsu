import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getDeviceId } from '@/lib/device-id'

export async function POST(request: Request) {
  const deviceId = await getDeviceId()
  if (!deviceId) {
    return NextResponse.json({ status: 'error', message: '端末IDが見つかりません' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const postId = Number(body.post_id)
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ status: 'error', message: '投稿IDが必要です' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase.rpc('toggle_dislike', {
    p_post_id: postId,
    p_device_id: deviceId,
  })

  if (error) {
    console.error(error)
    return NextResponse.json({ status: 'error', message: '処理に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ status: 'success', ...data })
}

export async function GET(request: Request) {
  const deviceId = await getDeviceId()
  if (!deviceId) {
    return NextResponse.json({ disliked_post_ids: [] })
  }

  const { searchParams } = new URL(request.url)
  const postIds = searchParams.get('post_ids')?.split(',').map(Number).filter(Boolean) || []

  if (postIds.length === 0) {
    return NextResponse.json({ disliked_post_ids: [] })
  }

  const supabase = createServerClient()
  const { data } = await supabase
    .from('post_dislikes')
    .select('post_id')
    .eq('device_id', deviceId)
    .in('post_id', postIds)

  return NextResponse.json({
    disliked_post_ids: (data || []).map(r => r.post_id),
  })
}
