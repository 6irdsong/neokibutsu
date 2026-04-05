'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import clsx from 'clsx'
import type { Post, Report } from '@/lib/types'
import { createBrowserClient } from '@/lib/supabase'
import { normalizeSearch } from '@/lib/normalize'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/ConfirmDialog'
import PostCard from '@/components/PostCard'
import { RespondForm, Pagination } from './shared'

export function PostsTab() {
  const toast = useToast()
  const { confirm } = useConfirm()
  const supabase = useMemo(() => createBrowserClient(), [])
  const [posts, setPosts] = useState<Post[]>([])
  const [postReports, setPostReports] = useState<Record<number, Report[]>>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [subQuery, setSubQuery] = useState('')
  const [teaQuery, setTeaQuery] = useState('')
  const [subInput, setSubInput] = useState('')
  const [teaInput, setTeaInput] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'dislikes'>('newest')
  const [reportedOnly, setReportedOnly] = useState(false)
  const [resolvedOnly, setResolvedOnly] = useState(false)
  const [deletedOnly, setDeletedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [respondingId, setRespondingId] = useState<number | null>(null)
  const perPage = 20

  const fetchReportsForPosts = useCallback(async (postIds: number[]) => {
    if (postIds.length === 0) {
      setPostReports({})
      return
    }
    const { data } = await supabase
      .from('reports')
      .select('*')
      .neq('subject', '管理者への連絡')
      .in('post_id', postIds)
      .order('created_at', { ascending: false })

    const grouped: Record<number, Report[]> = {}
    for (const r of (data || []) as Report[]) {
      if (!grouped[r.post_id]) grouped[r.post_id] = []
      grouped[r.post_id].push(r)
    }
    setPostReports(grouped)
  }, [supabase])

  const fetchPosts = useCallback(async (sub: string, tea: string, cat: string, p: number, sort: 'newest' | 'dislikes' = 'newest', reported = false, resolved = false, deleted = false) => {
    setLoading(true)
    try {
      const normalizedSub = sub ? normalizeSearch(sub) : ''
      const normalizedTea = tea ? normalizeSearch(tea) : ''

      // Get reported/resolved post IDs if filter is on
      let filteredIds: number[] | null = null
      if (reported || resolved) {
        const q = supabase
          .from('reports')
          .select('post_id')
          .neq('subject', '管理者への連絡')
          .eq('status', reported ? 'pending' : 'resolved')
        const { data: reportData } = await q
        filteredIds = [...new Set((reportData || []).map(r => r.post_id).filter(Boolean))]
        if (filteredIds.length === 0) {
          setPosts([])
          setPostReports({})
          setPage(1)
          setTotalPages(1)
          setTotal(0)
          setLoading(false)
          return
        }
      }

      // Count
      let countQ = supabase.from('posts').select('*', { count: 'exact', head: true })
      if (deleted) countQ = countQ.not('deleted_at', 'is', null)
      else countQ = countQ.is('deleted_at', null)
      if (normalizedSub) countQ = countQ.ilike('subject_normalized', `%${normalizedSub}%`)
      if (normalizedTea) countQ = countQ.ilike('teacher_normalized', `%${normalizedTea}%`)
      if (cat) countQ = countQ.eq('category', cat)
      if (filteredIds) countQ = countQ.in('id', filteredIds)
      const { count } = await countQ

      const t = count || 0
      const tp = Math.max(1, Math.ceil(t / perPage))
      const cp = Math.min(p, tp)

      // Data
      let dataQ = supabase.from('posts').select('*')
      if (deleted) dataQ = dataQ.not('deleted_at', 'is', null)
      else dataQ = dataQ.is('deleted_at', null)
      if (normalizedSub) dataQ = dataQ.ilike('subject_normalized', `%${normalizedSub}%`)
      if (normalizedTea) dataQ = dataQ.ilike('teacher_normalized', `%${normalizedTea}%`)
      if (cat) dataQ = dataQ.eq('category', cat)
      if (filteredIds) dataQ = dataQ.in('id', filteredIds)
      if (sort === 'dislikes') {
        dataQ = dataQ.order('dislike_count', { ascending: false }).order('id', { ascending: false })
      } else {
        dataQ = dataQ.order('id', { ascending: false })
      }
      const { data, error } = await dataQ
        .range((cp - 1) * perPage, cp * perPage - 1)

      if (error) {
        toast.error(error.message)
        return
      }

      const fetchedPosts = (data || []) as Post[]
      setPosts(fetchedPosts)
      setPage(cp)
      setTotalPages(tp)
      setTotal(t)

      // Fetch reports for displayed posts
      await fetchReportsForPosts(fetchedPosts.map(p => p.id))
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchReportsForPosts])

  useEffect(() => {
    fetchPosts('', '', '', 1, 'newest', false, false, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSubQuery(subInput)
    setTeaQuery(teaInput)
    fetchPosts(subInput, teaInput, category, 1, sortBy, reportedOnly, resolvedOnly, deletedOnly)
  }

  function handleReset() {
    setSubInput('')
    setTeaInput('')
    setSubQuery('')
    setTeaQuery('')
    fetchPosts('', '', category, 1, sortBy, reportedOnly, resolvedOnly, deletedOnly)
  }

  function handleCategoryFilter(cat: string) {
    setCategory(cat)
    fetchPosts(subQuery, teaQuery, cat, 1, sortBy, reportedOnly, resolvedOnly, deletedOnly)
  }

  function handleSortChange(sort: 'newest' | 'dislikes') {
    setSortBy(sort)
    fetchPosts(subQuery, teaQuery, category, 1, sort, reportedOnly, resolvedOnly, deletedOnly)
  }

  function handleReportedToggle() {
    const next = !reportedOnly
    setReportedOnly(next)
    setResolvedOnly(false)
    setDeletedOnly(false)
    fetchPosts(subQuery, teaQuery, category, 1, sortBy, next, false, false)
  }

  function handleResolvedToggle() {
    const next = !resolvedOnly
    setReportedOnly(false)
    setResolvedOnly(next)
    setDeletedOnly(false)
    fetchPosts(subQuery, teaQuery, category, 1, sortBy, false, next, false)
  }

  function handleDeletedToggle() {
    const next = !deletedOnly
    setReportedOnly(false)
    setResolvedOnly(false)
    setDeletedOnly(next)
    fetchPosts(subQuery, teaQuery, category, 1, sortBy, false, false, next)
  }

  async function handleDeletePost(postId: number) {
    const ok = await confirm({
      title: '投稿の削除',
      message: `投稿ID ${postId} を削除しますか？この操作は取り消せません。`,
      destructive: true,
      confirmLabel: '削除する',
    })
    if (!ok) return
    const res = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId, password: '' }),
    })
    const data = await res.json()
    if (data.status === 'success') {
      toast.success('削除しました')
      // Resolve pending reports for this post
      const pendingReports = (postReports[postId] || []).filter(r => r.status === 'pending')
      for (const r of pendingReports) {
        await fetch('/api/admin/report/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_id: r.id, admin_response: '投稿を削除しました' }),
        })
      }
      fetchPosts(subQuery, teaQuery, category, page, sortBy, reportedOnly, resolvedOnly, deletedOnly)
    } else {
      toast.error(data.message)
    }
  }

  async function handleRestorePost(postId: number) {
    const ok = await confirm({
      title: '投稿の復元',
      message: `投稿ID ${postId} を復元しますか？`,
      confirmLabel: '復元する',
    })
    if (!ok) return
    const res = await fetch('/api/admin/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    })
    const data = await res.json()
    if (data.status === 'success') {
      toast.success('復元しました')
      fetchPosts(subQuery, teaQuery, category, page, sortBy, reportedOnly, resolvedOnly, deletedOnly)
    } else {
      toast.error(data.message)
    }
  }

  async function handleBanDevice(deviceId: string) {
    const ok = await confirm({
      title: '端末BAN',
      message: 'この端末をBANしますか？',
      destructive: true,
      confirmLabel: 'BANする',
    })
    if (!ok) return
    const res = await fetch('/api/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, password: '' }),
    })
    const data = await res.json()
    if (data.status === 'success') {
      toast.success('BANしました')
      fetchPosts(subQuery, teaQuery, category, page, sortBy, reportedOnly, resolvedOnly, deletedOnly)
    } else {
      toast.error(data.message)
    }
  }

  async function handleChangeCategory(postId: number, currentCategory: string) {
    const newCategory = currentCategory === '専門科目' ? '全学教育科目' : '専門科目'
    const res = await fetch('/api/update-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, category: newCategory, password: '' }),
    })
    const data = await res.json()
    if (data.status === 'success') {
      toast.success('科目区分を変更しました')
      fetchPosts(subQuery, teaQuery, category, page, sortBy, reportedOnly, resolvedOnly, deletedOnly)
    } else {
      toast.error(data.message)
    }
  }

  async function handleEditComment(postId: number, comment: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/edit-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, comment }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        toast.success('コメントを更新しました')
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment } : p))
        return true
      }
      toast.error(data.message || 'エラーが発生しました')
      return false
    } catch {
      toast.error('更新に失敗しました')
      return false
    }
  }

  async function handleRespondReport(reportId: number, response: string) {
    setRespondingId(reportId)
    try {
      const res = await fetch('/api/admin/report/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, admin_response: response }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        toast.success('返信を送信しました')
        // Refresh reports for current posts
        await fetchReportsForPosts(posts.map(p => p.id))
      } else {
        toast.error(data.message || 'エラーが発生しました')
      }
    } finally {
      setRespondingId(null)
    }
  }

  function handleReport() {}

  return (
    <div>
      {/* Category tabs + Search form */}
      <div className="bg-card-bg border border-[var(--card-border-color)] rounded-md px-4 py-3 mb-3">
        {/* Category row */}
        <div className="flex gap-2 mb-2 flex-wrap items-center">
          <span className="text-[11px] text-dark-gray shrink-0">科目</span>
          {[
            { value: '', label: 'すべて' },
            { value: '全学教育科目', label: '全学' },
            { value: '専門科目', label: '専門' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => handleCategoryFilter(tab.value)}
              className={clsx(
                'py-1.5 px-3.5 border cursor-pointer text-[13px] rounded-md transition-all duration-200',
                category === tab.value ? 'bg-accent text-btn-text-on-accent border-[var(--accent-border)]' : 'bg-transparent text-dark-gray border-border hover:text-text'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Status filter row */}
        <div className="flex gap-2 mb-2 flex-wrap items-center">
          <span className="text-[11px] text-dark-gray shrink-0">フィルター</span>
          <button
            onClick={handleReportedToggle}
            className={clsx(
              'py-1.5 px-3.5 border cursor-pointer text-[13px] rounded-md transition-all duration-200',
              reportedOnly ? 'bg-orange-500 text-white border-orange-600' : 'bg-transparent text-dark-gray border-border hover:text-text'
            )}
          >
            通報あり
          </button>
          <button
            onClick={handleResolvedToggle}
            className={clsx(
              'py-1.5 px-3.5 border cursor-pointer text-[13px] rounded-md transition-all duration-200',
              resolvedOnly ? 'bg-green-600 text-white border-green-700' : 'bg-transparent text-dark-gray border-border hover:text-text'
            )}
          >
            通報(対処済み)
          </button>
          <button
            onClick={handleDeletedToggle}
            className={clsx(
              'py-1.5 px-3.5 border cursor-pointer text-[13px] rounded-md transition-all duration-200',
              deletedOnly ? 'bg-red-500 text-white border-red-600' : 'bg-transparent text-dark-gray border-border hover:text-text'
            )}
          >
            削除済み
          </button>
        </div>
        {/* Sort row */}
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          <span className="text-[11px] text-dark-gray shrink-0">ソート</span>
          {[
            { value: 'newest' as const, label: '新着順' },
            { value: 'dislikes' as const, label: '低評価順' },
          ].map(s => (
            <button
              key={s.value}
              onClick={() => handleSortChange(s.value)}
              className={clsx(
                'py-1.5 px-3.5 border cursor-pointer text-[13px] rounded-md transition-all duration-200',
                sortBy === s.value ? 'bg-accent text-btn-text-on-accent border-[var(--accent-border)]' : 'bg-transparent text-dark-gray border-border hover:text-text'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2.5 items-center max-md:flex-wrap max-md:justify-end">
          <input type="text" placeholder="講義名" value={subInput} onChange={e => setSubInput(e.target.value)} className="text-base h-[30px] py-0.5 px-[5px] border border-dark-gray flex-1 max-md:w-full max-md:flex-none" />
          <input type="text" placeholder="教員名" value={teaInput} onChange={e => setTeaInput(e.target.value)} className="text-base h-[30px] py-0.5 px-[5px] border border-dark-gray flex-1 max-md:w-full max-md:flex-none" />
          <button type="submit" className="h-8 w-20 text-sm shrink-0 inline-flex items-center justify-center rounded-sm border border-[var(--accent-border)] bg-accent text-btn-text-on-accent cursor-pointer transition-all duration-200 hover:opacity-80">検索</button>
          <button type="button" onClick={handleReset} className="h-8 w-20 text-[13px] shrink-0 inline-flex items-center justify-center rounded-sm border border-border bg-transparent text-dark-gray cursor-pointer transition-all duration-200 hover:bg-light-gray hover:text-text">リセット</button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-8 text-dark-gray text-[13px]">読み込み中...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-6 text-dark-gray text-[13px]">投稿が見つかりません。</div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {posts.map(post => {
            const reports = postReports[post.id] || []
            return (
              <div key={post.id}>
                <PostCard
                  post={post}
                  isAdmin={true}
                  adminOnly={true}
                  onReport={handleReport}
                  onDelete={deletedOnly ? undefined : handleDeletePost}
                  onRestore={deletedOnly ? handleRestorePost : undefined}
                  onBan={handleBanDevice}
                  onChangeCategory={handleChangeCategory}
                  onEditComment={handleEditComment}
                />
                {reports.length > 0 && (
                  <div className="ml-4 mr-2 mb-2 border-l-2 border-orange-400/50 pl-3">
                    {reports.map(report => (
                      <div key={report.id} className="py-2 border-b border-border/50 last:border-b-0">
                        <div className="flex gap-2 items-baseline flex-wrap">
                          <span className={clsx(
                            'text-[10px] py-0.5 px-1.5 rounded-full font-medium',
                            report.status === 'pending'
                              ? 'bg-orange-500/10 text-orange-600'
                              : 'bg-success-bg text-success'
                          )}>
                            {report.status === 'pending' ? '未対応' : '対応済み'}
                          </span>
                          {report.category && (
                            <span className="text-[10px] py-0.5 px-1.5 rounded-full bg-accent/10 text-accent font-medium">{report.category}</span>
                          )}
                          <span className="text-xs text-dark-gray">{report.created_at}</span>
                          {report.reporter_anonymous_id && (
                            <span className="text-[10px] py-0.5 px-1.5 rounded-full bg-blue-500/10 text-blue-600 font-medium">ログイン済み</span>
                          )}
                          {report.reporter_device_created === 'legacy' && (
                            <span className="text-[10px] py-0.5 px-1.5 rounded-full bg-gray-500/10 text-dark-gray font-medium">旧デバイス</span>
                          )}
                          {(report.reporter_sus_count || 0) > 0 && (
                            <span className="text-[10px] py-0.5 px-1.5 rounded-full bg-red-500/10 text-red-600 font-medium cursor-help" title="Cookie署名の検証に失敗した回数。改ざん・Cookie消去・シークレットモード等が原因の可能性があります。">
                              ⚠ sus{report.reporter_sus_count}
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] text-text mt-1">{report.reason}</div>
                        {report.status !== 'pending' && report.admin_response && (
                          <div className="text-xs text-dark-gray mt-1">→ {report.admin_response}</div>
                        )}
                        {report.status === 'pending' && (
                          <div className="mt-1.5">
                            {report.reporter_anonymous_id ? (
                              <RespondForm
                                reportId={report.id}
                                subject={post.subject}
                                onRespond={handleRespondReport}
                                loading={respondingId === report.id}
                              />
                            ) : (
                              <button
                                className="text-[11px] py-1 px-2.5 border-none cursor-pointer rounded-sm bg-accent text-btn-text-on-accent transition-all duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={respondingId === report.id}
                                onClick={() => handleRespondReport(report.id, '')}
                              >
                                {respondingId === report.id ? '処理中...' : '対応済みにする'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={p => fetchPosts(subQuery, teaQuery, category, p, sortBy, reportedOnly, resolvedOnly, deletedOnly)} />
    </div>
  )
}
