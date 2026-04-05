'use client'

import { memo, useState } from 'react'
import clsx from 'clsx'
import type { Post } from '@/lib/types'

interface PostCardProps {
  post: Post
  isAdmin: boolean
  adminOnly?: boolean
  liked?: boolean
  disliked?: boolean
  bookmarked?: boolean
  onReport: (post: Post) => void
  onDelete?: (postId: number) => void
  onRestore?: (postId: number) => void
  onBan?: (deviceId: string) => void
  onChangeCategory?: (postId: number, currentCategory: string) => void
  onLike?: (postId: number) => void
  onDislike?: (postId: number) => void
  onBookmark?: (postId: number) => void
  onEditComment?: (postId: number, comment: string) => Promise<boolean>
}

function openHupass(subject: string, teacher: string) {
  const parts = [subject, teacher].filter(Boolean)
  const keyword = parts.map(s => {
    // Normalize Roman numerals
    s = s.replace(/[I\uFF29\u2160]{1,4}/g, (m, offset, str) => {
      const len = m.length
      if (len === 1) {
        const next = str[offset + 1]
        if (next && /[A-Za-z\uFF21-\uFF3A\uFF41-\uFF5A]/.test(next)) return m
      }
      return ['\u2160', '\u2161', '\u2162', '\u2163'][len - 1] || m
    })
    s = s.replace(/[\u2022\u30FB]/g, '')
    s = s.replace(/[\u002D\u2010\u2013\u2014\u2015\u30FC\uFF0D]/g, '')
    s = s.replace(/[;;\uFF1A:~\uFF5E]/g, '')
    s = s.replace(/[()\uFF08\uFF09\u3010\u3011\u300C\u300D\u3008\u3009\u300A\u300B\u3014\u3015]/g, '')
    return s.replace(/\s+/g, '').split('').join(' ')
  }).join(' ')
  window.open('https://hupass.hu-jagajaga.com/search?keyword=' + encodeURIComponent(keyword) + '&order_by=relevance', '_blank')
}

const btnBase = 'no-underline text-xs px-3 h-7 border border-border cursor-pointer rounded-sm inline-flex items-center justify-center gap-1 bg-transparent text-dark-gray transition-colors duration-150 hover:bg-light-gray'

export default memo(function PostCard({ post, isAdmin, adminOnly, liked, disliked, bookmarked, onReport, onDelete, onRestore, onBan, onChangeCategory, onLike, onDislike, onBookmark, onEditComment }: PostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  return (
    <div
      className={clsx('post-card select-none', expanded && 'post-card-expanded')}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-center w-full pb-0.5">
        <div className="flex items-center gap-[15px] flex-1 min-w-0 flex-wrap max-xs:flex-col max-xs:items-start max-xs:gap-0.5">
          {adminOnly && <span className="text-[11px] text-dark-gray font-normal">#{post.id}</span>}
          <div className="text-[1.25em] font-bold text-text leading-tight mb-0">{post.subject}</div>
          <div className="text-[0.9em] text-dark-gray leading-tight whitespace-nowrap mt-1 max-xs:text-[0.85em] max-xs:overflow-hidden max-xs:text-ellipsis max-xs:max-w-60"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline-block align-middle -mt-0.5 mr-0.5"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z"/></svg>{post.teacher}</div>
        </div>
        <div className="flex items-center gap-[15px] shrink-0 ml-2.5">
          <span className="text-[0.9em] text-dark-gray font-normal max-xs:hidden">{post.author ? `by ${post.author}` : ''}</span>
          <span className="text-[11px] text-dark-gray whitespace-nowrap mt-1 max-xs:whitespace-normal max-xs:text-right max-xs:text-[10px] max-xs:leading-tight">
            {post.date ? <>{post.date.split(/(?<=年)/).map((part, i) => <span key={i}>{i > 0 && <br className="hidden max-xs:inline" />}{part}</span>)}</> : ''}
          </span>
          {adminOnly && (post.dislike_count || 0) > 0 && (
            <span className="text-[11px] text-red-500 font-medium whitespace-nowrap">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="inline-block align-middle -mt-0.5 mr-0.5"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>
              {post.dislike_count}
            </span>
          )}
          <div className="bg-light-gray py-0.5 px-2 rounded border border-border font-bold text-[1.1em] text-center min-w-[40px] text-text">
            {!post.rating || post.rating === '--' ? '-' : post.rating}
          </div>
        </div>
      </div>

      <div className={clsx('post-details', expanded && 'expanded')}>
        <div className="post-details-inner">
          <div>
            <div>
              {post.category && <span className="border border-border bg-light-gray text-text py-0.5 px-2 text-[11px] mr-1 inline-block rounded-sm">{post.category}</span>}
              {post.test && post.test !== '--' && <span className="border border-border bg-light-gray text-text py-0.5 px-2 text-[11px] mr-1 inline-block rounded-sm">テスト: {post.test}</span>}
              {post.assignment && post.assignment !== '--' && <span className="border border-border bg-light-gray text-text py-0.5 px-2 text-[11px] mr-1 inline-block rounded-sm">課題: {post.assignment}</span>}
              {post.report && post.report !== '--' && <span className="border border-border bg-light-gray text-text py-0.5 px-2 text-[11px] mr-1 inline-block rounded-sm">レポート: {post.report}</span>}
              {post.attendance && post.attendance !== '--' && <span className="border border-border bg-light-gray text-text py-0.5 px-2 text-[11px] mr-1 inline-block rounded-sm">出席: {post.attendance}</span>}
            </div>
            {editing ? (
              <div className="mt-2 ml-2" onClick={e => e.stopPropagation()}>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full min-h-[80px] resize-y py-1.5 px-2.5 text-[13px] rounded-md border border-border bg-card-bg text-text leading-relaxed"
                  disabled={saving}
                />
                <div className="flex gap-1.5 mt-1.5 justify-end">
                  <button
                    type="button"
                    className={clsx(btnBase, 'border-border bg-transparent text-dark-gray hover:bg-light-gray')}
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >キャンセル</button>
                  <button
                    type="button"
                    className={clsx(btnBase, 'border-transparent bg-accent text-btn-text-on-accent hover:opacity-80')}
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true)
                      const ok = await onEditComment?.(post.id, editText)
                      setSaving(false)
                      if (ok) setEditing(false)
                    }}
                  >{saving ? '保存中...' : '保存'}</button>
                </div>
              </div>
            ) : (
              <div className="mt-2 ml-2 leading-relaxed whitespace-pre-wrap">
                {post.comment}
                {adminOnly && onEditComment && (
                  <button
                    type="button"
                    className="ml-2 text-[11px] text-dark-gray hover:text-accent cursor-pointer bg-transparent border-none p-0 align-middle"
                    onClick={e => { e.stopPropagation(); setEditText(post.comment); setEditing(true) }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1.5 items-center flex-wrap mt-4 justify-end bg-transparent!">
            {!adminOnly && onLike && (
              <button
                type="button"
                className={clsx(
                  btnBase,
                  (post.like_count || 0) === 0 && 'max-md:!px-0 max-md:!w-7',
                  liked
                    ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/15'
                    : 'hover:text-accent'
                )}
                onClick={(e) => { e.stopPropagation(); onLike(post.id) }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                {(post.like_count || 0) > 0 ? <span className="ml-1">{post.like_count}</span> : <span className="ml-1 max-md:hidden">参考になった</span>}
              </button>
            )}
            {!adminOnly && onDislike && (
              <button
                type="button"
                className={clsx(
                  btnBase,
                  'mr-auto',
                  disliked
                    ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/15'
                    : 'hover:text-red-500'
                )}
                onClick={(e) => { e.stopPropagation(); onDislike(post.id) }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>
              </button>
            )}
            {!adminOnly && (
              <button
                type="button"
                className={clsx(
                  btnBase,
                  bookmarked
                    ? '!bg-accent !text-btn-text-on-accent !border-[var(--accent-border)]'
                    : ''
                )}
                onClick={(e) => { e.stopPropagation(); onBookmark?.(post.id) }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              </button>
            )}
            {!adminOnly && (
              <>
                <button
                  type="button"
                  className={clsx(btnBase, '!bg-[var(--hupass-bg)] !text-[var(--hupass-text)] !border-[var(--hupass-border)] hover:!bg-[var(--hupass-bg-hover)]')}
                  onClick={(e) => { e.stopPropagation(); openHupass(post.subject, post.teacher) }}
                >
                  Hupassで検索
                </button>
                <button
                  type="button"
                  className={clsx(btnBase, 'bg-[var(--button-report-bg)] text-[var(--button-report-color)] border-border hover:bg-[var(--button-report-bg-hover)] hover:text-[var(--button-report-color)]')}
                  onClick={(e) => { e.stopPropagation(); onReport(post) }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                  通報
                </button>
              </>
            )}
            {isAdmin && (
              <>
                <button
                  type="button"
                  className={clsx(btnBase, 'bg-[var(--button-report-bg)] text-[var(--button-report-color)] border-border hover:bg-[var(--button-report-bg-hover)] hover:text-[var(--button-report-color)]')}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChangeCategory?.(post.id, post.category)
                  }}
                >
                  区分変更
                </button>
                {onRestore ? (
                  <button
                    type="button"
                    className={clsx(btnBase, 'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700 hover:text-white')}
                    onClick={(e) => { e.stopPropagation(); onRestore(post.id) }}
                  >
                    復元
                  </button>
                ) : (
                  <button
                    type="button"
                    className={clsx(btnBase, 'bg-[var(--button-delete-bg)] text-[var(--button-delete-color)] border-[var(--button-delete-bg)] hover:bg-[var(--button-delete-bg-hover)] hover:border-[var(--button-delete-bg-hover)] hover:text-[var(--button-delete-color)]')}
                    onClick={(e) => { e.stopPropagation(); onDelete?.(post.id) }}
                  >
                    削除
                  </button>
                )}
                <button
                  type="button"
                  className={clsx(btnBase, 'bg-[#343a40]! text-white! border-[#343a40]! hover:bg-[#c82333]! hover:border-[#c82333]!')}
                  onClick={(e) => { e.stopPropagation(); onBan?.(post.device_id) }}
                >
                  BAN
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
