import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'
import { getDeviceId } from '@/lib/device-id'
import { getAnonymousId } from '@/lib/anonymous-id'

// Unified status endpoint: returns like, dislike, bookmark status in one call
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postIds = searchParams.get('post_ids')?.split(',').map(Number).filter(Boolean) || []

  if (postIds.length === 0) {
    return NextResponse.json({ liked_post_ids: [], disliked_post_ids: [], bookmarked_post_ids: [] })
  }

  const deviceId = await getDeviceId()
  if (!deviceId) {
    return NextResponse.json({ liked_post_ids: [], disliked_post_ids: [], bookmarked_post_ids: [] })
  }

  const supabase = createServerClient()

  // Fetch like, dislike, bookmark status in parallel
  const likesP = supabase
    .from('post_likes')
    .select('post_id')
    .eq('device_id', deviceId)
    .in('post_id', postIds)

  const dislikesP = supabase
    .from('post_dislikes')
    .select('post_id')
    .eq('device_id', deviceId)
    .in('post_id', postIds)

  // Bookmark requires auth
  const bookmarksP = (async () => {
    const authSupabase = await createAuthServerClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return []
    const anonymousId = getAnonymousId(user.id)
    const { data } = await supabase
      .from('post_bookmarks')
      .select('post_id')
      .eq('anonymous_id', anonymousId)
      .in('post_id', postIds)
    return (data || []).map(r => r.post_id)
  })()

  const [likes, dislikes, bookmarkedIds] = await Promise.all([likesP, dislikesP, bookmarksP])

  return NextResponse.json({
    liked_post_ids: (likes.data || []).map(r => r.post_id),
    disliked_post_ids: (dislikes.data || []).map(r => r.post_id),
    bookmarked_post_ids: bookmarkedIds,
  })
}
