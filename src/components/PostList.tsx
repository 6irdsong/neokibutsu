'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import type { Post } from '@/lib/types'
import { createBrowserClient } from '@/lib/supabase'
import { normalizeSearch } from '@/lib/normalize'
import { POST_PUBLIC_COLUMNS } from '@/lib/columns'
import PostCard from './PostCard'
import ReportModal from './ReportModal'
import { useAuth } from './AuthProvider'
import { useToast } from './Toast'
import { Pagination } from './admin/shared'

interface PostListProps {
  initialPosts: Post[]
  initialPage: number
  initialHasNext: boolean
  initialTotalPages: number
  initialSubQ: string
  initialTeaQ: string
  initialCat: string
  isAdmin: boolean
}

const PER_PAGE = 50

export default function PostList({
  initialPosts, initialPage, initialHasNext, initialTotalPages,
  initialSubQ, initialTeaQ, initialCat,
  isAdmin,
}: PostListProps) {
  const router = useRouter()
  const toast = useToast()
  const supabase = useMemo(() => createBrowserClient(), [])
  const pendingActions = useRef(new Set<number>())
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [page, setPage] = useState(initialPage)
  const [hasNext, setHasNext] = useState(initialHasNext)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [subQ, setSubQ] = useState(initialSubQ)
  const [teaQ, setTeaQ] = useState(initialTeaQ)
  const [cat, setCat] = useState(initialCat)
  const [subInput, setSubInput] = useState(initialSubQ)
  const [teaInput, setTeaInput] = useState(initialTeaQ)
  const [loading, setLoading] = useState(false)

  const [reportTarget, setReportTarget] = useState<Post | null>(null)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())
  const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set())
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set())
  const [searchOpen, setSearchOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('searchOpen') === 'true'
  })
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)
  const { user, setShowLoginModal } = useAuth()

  // Listen for search toggle from Header
  useEffect(() => {
    const handler = (e: Event) => {
      const open = (e as CustomEvent).detail
      setSearchOpen(open)
      if (open) window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('searchToggle', handler)
    return () => window.removeEventListener('searchToggle', handler)
  }, [])

  // Fetch like/dislike/bookmark status in a single request
  const fetchStatuses = useCallback(async (postIds: number[]) => {
    if (postIds.length === 0) return
    try {
      const res = await fetch(`/api/status?post_ids=${postIds.join(',')}`)
      const data = await res.json()
      setLikedIds(new Set(data.liked_post_ids || []))
      setDislikedIds(new Set(data.disliked_post_ids || []))
      setBookmarkedIds(new Set(data.bookmarked_post_ids || []))
    } catch {
      // Silently fail
    }
  }, [])

  // Sync client state when server-provided initialPosts change (e.g. after router.refresh())
  useEffect(() => {
    setPosts(initialPosts)
    setPage(initialPage)
    setHasNext(initialHasNext)
    setTotalPages(initialTotalPages)
    fetchStatuses(initialPosts.map(p => p.id))
  }, [initialPosts]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch statuses on login/logout
  useEffect(() => {
    fetchStatuses(posts.map(p => p.id))
    if (!user) {
      setShowBookmarks(false)
      setBookmarkedPosts([])
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLike(postId: number) {
    if (pendingActions.current.has(postId)) return
    pendingActions.current.add(postId)
    const wasLiked = likedIds.has(postId)
    const wasDisliked = dislikedIds.has(postId)

    // Optimistic update
    setLikedIds(prev => {
      const next = new Set(prev)
      if (wasLiked) next.delete(postId)
      else next.add(postId)
      return next
    })
    if (!wasLiked && wasDisliked) {
      setDislikedIds(prev => { const next = new Set(prev); next.delete(postId); return next })
    }
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, like_count: p.like_count + (wasLiked ? -1 : 1), dislike_count: (!wasLiked && wasDisliked) ? Math.max(0, p.dislike_count - 1) : p.dislike_count }
        : p
    ))

    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })
      const data = await res.json()
      if (data.status !== 'success') throw new Error()
    } catch {
      // Revert
      setLikedIds(prev => {
        const next = new Set(prev)
        if (wasLiked) next.add(postId)
        else next.delete(postId)
        return next
      })
      if (!wasLiked && wasDisliked) {
        setDislikedIds(prev => { const next = new Set(prev); next.add(postId); return next })
      }
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, like_count: p.like_count + (wasLiked ? 1 : -1), dislike_count: (!wasLiked && wasDisliked) ? p.dislike_count + 1 : p.dislike_count }
          : p
      ))
    } finally {
      pendingActions.current.delete(postId)
    }
  }

  async function handleDislike(postId: number) {
    if (pendingActions.current.has(postId)) return
    pendingActions.current.add(postId)
    const wasDisliked = dislikedIds.has(postId)
    const wasLiked = likedIds.has(postId)

    // Optimistic update
    setDislikedIds(prev => {
      const next = new Set(prev)
      if (wasDisliked) next.delete(postId)
      else next.add(postId)
      return next
    })
    if (!wasDisliked && wasLiked) {
      setLikedIds(prev => { const next = new Set(prev); next.delete(postId); return next })
    }
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, like_count: (!wasDisliked && wasLiked) ? Math.max(0, p.like_count - 1) : p.like_count }
        : p
    ))

    try {
      const res = await fetch('/api/dislike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })
      const data = await res.json()
      if (data.status !== 'success') throw new Error()
    } catch {
      // Revert
      setDislikedIds(prev => {
        const next = new Set(prev)
        if (wasDisliked) next.add(postId)
        else next.delete(postId)
        return next
      })
      if (!wasDisliked && wasLiked) {
        setLikedIds(prev => { const next = new Set(prev); next.add(postId); return next })
      }
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, like_count: (!wasDisliked && wasLiked) ? p.like_count + 1 : p.like_count }
          : p
      ))
    } finally {
      pendingActions.current.delete(postId)
    }
  }

  async function handleBookmark(postId: number) {
    if (pendingActions.current.has(postId)) return
    if (!user) {
      setShowLoginModal(true)
      return
    }

    pendingActions.current.add(postId)

    // Optimistic update
    const wasBookmarked = bookmarkedIds.has(postId)
    setBookmarkedIds(prev => {
      const next = new Set(prev)
      if (wasBookmarked) next.delete(postId)
      else next.add(postId)
      return next
    })
    if (showBookmarks) {
      if (wasBookmarked) {
        setBookmarkedPosts(prev => prev.filter(p => p.id !== postId))
      } else {
        const post = posts.find(p => p.id === postId)
        if (post) setBookmarkedPosts(prev => [post, ...prev])
      }
    }

    try {
      const res = await fetch('/api/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })
      const data = await res.json()
      if (data.status !== 'success') throw new Error()
    } catch {
      // Revert on failure
      setBookmarkedIds(prev => {
        const next = new Set(prev)
        if (wasBookmarked) next.add(postId)
        else next.delete(postId)
        return next
      })
      if (showBookmarks) {
        if (wasBookmarked) {
          const post = posts.find(p => p.id === postId)
          if (post) setBookmarkedPosts(prev => [post, ...prev])
        } else {
          setBookmarkedPosts(prev => prev.filter(p => p.id !== postId))
        }
      }
    } finally {
      pendingActions.current.delete(postId)
    }
  }

  async function fetchBookmarkedPosts() {
    setLoadingBookmarks(true)
    try {
      // Get all bookmarked post IDs
      const res = await fetch('/api/bookmark')
      const data = await res.json()
      const ids: number[] = data.bookmarked_post_ids || []
      if (ids.length === 0) {
        setBookmarkedPosts([])
        return
      }
      // Fetch posts by IDs
      const { data: postsData } = await supabase
        .from('posts')
        .select(POST_PUBLIC_COLUMNS)
        .in('id', ids)
        .is('deleted_at', null)
        .order('id', { ascending: false })
      setBookmarkedPosts((postsData || []) as Post[])
      setBookmarkedIds(new Set(ids))
    } finally {
      setLoadingBookmarks(false)
    }
  }

  function toggleBookmarks() {
    if (!showBookmarks) {
      setSubInput('')
      setTeaInput('')
      fetchBookmarkedPosts()
    }
    setShowBookmarks(!showBookmarks)
  }

  const fetchPosts = useCallback(async (sq: string, tq: string, c: string, p: number) => {
    setLoading(true)
    try {
      // Build count and data queries
      let countQ = supabase.from('posts').select('*', { count: 'exact', head: true }).is('deleted_at', null)
      let dataQ = supabase.from('posts').select('*').is('deleted_at', null)
      if (c !== 'all') { countQ = countQ.eq('category', c); dataQ = dataQ.eq('category', c) }
      if (sq) { countQ = countQ.ilike('subject_normalized', `%${normalizeSearch(sq)}%`); dataQ = dataQ.ilike('subject_normalized', `%${normalizeSearch(sq)}%`) }
      if (tq) { countQ = countQ.ilike('teacher_normalized', `%${normalizeSearch(tq)}%`); dataQ = dataQ.ilike('teacher_normalized', `%${normalizeSearch(tq)}%`) }
      dataQ = dataQ.order('id', { ascending: false }).range((p - 1) * PER_PAGE, p * PER_PAGE - 1)

      // Run count and data queries in parallel
      const [{ count }, { data, error }] = await Promise.all([countQ, dataQ])
      if (error || !data) return

      const tp = Math.max(1, Math.ceil((count || 0) / PER_PAGE))
      setTotalPages(tp)
      setHasNext(p < tp)

      const newPosts = data as Post[]
      setPosts(newPosts)
      setPage(p)
      setSubQ(sq)
      setTeaQ(tq)
      setCat(c)

      // Fetch statuses for new posts
      fetchStatuses(newPosts.map(post => post.id))

      // Update URL without navigation
      const params = new URLSearchParams()
      if (sq) params.set('sub_q', sq)
      if (tq) params.set('tea_q', tq)
      if (c !== 'all') params.set('cat', c)
      if (p > 1) params.set('page', String(p))
      const qs = params.toString()
      window.history.replaceState(null, '', qs ? `/?${qs}` : '/')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }, [supabase, fetchStatuses])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchPosts(subInput, teaInput, cat, 1)
  }

  function handleCatChange(c: string) {
    fetchPosts(subQ, teaQ, c, 1)
  }

  function handleReset() {
    setSubInput('')
    setTeaInput('')
    fetchPosts('', '', cat, 1)
  }

  async function handleDelete(postId: number) {
    if (!confirm('本当に削除しますか？')) return
    const res = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    })
    const data = await res.json()
    if (data.status === 'success') {
      fetchPosts(subQ, teaQ, cat, page)
    } else {
      alert(data.message || 'エラーが発生しました')
    }
  }

  async function handleBan(deviceId: string) {
    if (!confirm('この端末からの投稿を禁止しますか？')) return
    const res = await fetch('/api/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    })
    const data = await res.json()
    if (data.status === 'success') {
      fetchPosts(subQ, teaQ, cat, page)
    } else {
      alert(data.message || 'エラーが発生しました')
    }
  }

  async function handleChangeCategory(postId: number, currentCategory: string) {
    const newCategory = currentCategory === '専門科目' ? '全学教育科目' : '専門科目'
    if (!confirm(`科目区分を「${newCategory}」に変更しますか？`)) return
    const res = await fetch('/api/update-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, category: newCategory }),
    })
    const data = await res.json()
    if (data.status === 'success') {
      fetchPosts(subQ, teaQ, cat, page)
    } else {
      alert(data.message || 'エラーが発生しました')
    }
  }

  return (
    <>
      {/* Category tabs + Search form */}
      <div className={clsx('search-card-wrapper', searchOpen && 'search-card-open')}>
      <div className="search-card-inner bg-card-bg border border-[var(--dark-gray-color)] rounded-md px-4 py-3">
        <div className="flex gap-2 mb-3">
          <div className={clsx('flex gap-2', showBookmarks && 'opacity-40 pointer-events-none')}>
            {[
              { value: 'all', label: 'すべて', shortLabel: 'すべて' },
              { value: '全学教育科目', label: '全学教育科目', shortLabel: '全学' },
              { value: '専門科目', label: '専門科目(2年次以降)', shortLabel: '専門' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => { setShowBookmarks(false); handleCatChange(tab.value) }}
                className={clsx(
                  'py-1.5 px-3.5 border cursor-pointer text-[13px] rounded-md transition-all duration-200',
                  !showBookmarks && cat === tab.value ? 'bg-accent text-btn-text-on-accent border-[var(--accent-border)]' : 'bg-transparent text-dark-gray border-border hover:text-text'
                )}
              >
                <span className="max-md:hidden">{tab.label}</span>
                <span className="hidden max-md:inline">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
          {user && (
            <button
              onClick={toggleBookmarks}
              className={clsx(
                'py-1.5 px-3.5 border cursor-pointer text-[13px] rounded-md transition-all duration-200 ml-auto',
                showBookmarks ? 'bg-accent text-btn-text-on-accent border-[var(--accent-border)]' : 'bg-transparent text-dark-gray border-border hover:text-text'
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={showBookmarks ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block max-md:mr-0 mr-1 -mt-0.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              <span className="max-md:hidden">ブックマーク</span>
            </button>
          )}
        </div>
        <div className={clsx(showBookmarks && 'opacity-40 pointer-events-none')}>
        <form onSubmit={handleSearch} className="flex gap-2.5 items-center max-md:flex-wrap max-md:justify-end">
        <input type="text" placeholder="講義名" value={subInput} onChange={e => setSubInput(e.target.value)} className="text-base h-[30px] py-0.5 px-[5px] border border-dark-gray flex-1 max-md:w-full max-md:flex-none" />
        <input type="text" placeholder="教員名" value={teaInput} onChange={e => setTeaInput(e.target.value)} className="text-base h-[30px] py-0.5 px-[5px] border border-dark-gray flex-1 max-md:w-full max-md:flex-none" />
        <button type="button" onClick={() => fetchPosts(subInput, teaInput, cat, 1)} className="h-8 w-20 text-sm shrink-0 inline-flex items-center justify-center rounded-sm border border-[var(--accent-border)] bg-accent text-btn-text-on-accent cursor-pointer transition-all duration-200 hover:opacity-80">検索</button>
        <button type="button" onClick={handleReset} className="h-8 w-20 text-[13px] shrink-0 inline-flex items-center justify-center rounded-sm border border-border bg-transparent text-dark-gray cursor-pointer transition-all duration-200 hover:bg-light-gray hover:text-text">リセット</button>
        </form>
        </div>
      </div>
      </div>

      {/* Post grid */}
      {showBookmarks ? (
        <div className="grid grid-cols-1 gap-2 mt-3">
          {loadingBookmarks ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="post-card animate-pulse" style={{ minHeight: 56 }}>
                <div className="flex justify-between items-center w-full pb-0.5">
                  <div className="flex items-center gap-[15px] flex-1 min-w-0">
                    <div className="h-5 w-32 bg-light-gray rounded" />
                    <div className="h-4 w-20 bg-light-gray rounded" />
                  </div>
                  <div className="h-8 w-10 bg-light-gray rounded" />
                </div>
              </div>
            ))
          ) : bookmarkedPosts.length === 0 ? (
            <div className="text-center py-8 text-dark-gray text-[13px]">ブックマークはありません。</div>
          ) : (
            bookmarkedPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                isAdmin={isAdmin}
                liked={likedIds.has(post.id)}
                disliked={dislikedIds.has(post.id)}
                bookmarked={true}
                onReport={setReportTarget}
                onDelete={handleDelete}
                onBan={handleBan}
                onChangeCategory={handleChangeCategory}
                onBookmark={handleBookmark}
              />
            ))
          )}
        </div>
      ) : (
        <div
           className="grid grid-cols-1 gap-2 mt-3"
          onContextMenu={isAdmin ? undefined : (e) => e.preventDefault()}
        >
          {loading ? Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="post-card animate-pulse" style={{ minHeight: 56 }}>
              <div className="flex justify-between items-center w-full pb-0.5">
                <div className="flex items-center gap-[15px] flex-1 min-w-0">
                  <div className="h-5 w-32 bg-light-gray rounded" />
                  <div className="h-4 w-20 bg-light-gray rounded" />
                </div>
                <div className="h-8 w-10 bg-light-gray rounded" />
              </div>
            </div>
          )) : posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              isAdmin={isAdmin}
              liked={likedIds.has(post.id)}
              disliked={dislikedIds.has(post.id)}
              bookmarked={bookmarkedIds.has(post.id)}
              onReport={setReportTarget}
              onDelete={handleDelete}
              onBan={handleBan}
              onChangeCategory={handleChangeCategory}
              onBookmark={handleBookmark}
            />
          ))}
        </div>
      )}

      {!showBookmarks && (
        <Pagination page={page} totalPages={totalPages} onPageChange={p => fetchPosts(subQ, teaQ, cat, p)} />
      )}

      <ReportModal post={reportTarget} onClose={() => setReportTarget(null)} />
    </>
  )
}
