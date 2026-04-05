'use client'

import { useState } from 'react'
import clsx from 'clsx'

export function ActionButton({ label, onClick, disabled, variant }: {
  label: string
  onClick: () => void
  disabled?: boolean
  variant: 'delete' | 'ban' | 'default'
}) {
  const styles = {
    delete: 'bg-[var(--button-delete-bg)] text-[var(--button-delete-color)] hover:bg-[var(--button-delete-bg-hover)]',
    ban: 'bg-[var(--button-ban-bg)] text-white hover:bg-[var(--button-ban-bg-hover)]',
    default: 'bg-accent text-btn-text-on-accent',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'text-[11px] py-1 px-2.5 border-none cursor-pointer rounded-sm transition-all duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed',
        styles[variant]
      )}
    >
      {label}
    </button>
  )
}

const RESPONSE_TEMPLATES = [
  { label: '批判は対象外', text: '本投稿は講義・制度に対する評価であり、誹謗中傷には該当しないと判断しました。' },
  { label: '根拠不十分', text: '本投稿は投稿者の体験に基づくものであり、事実と異なるという具体的な根拠が示されていないため、現時点では削除対象外と判断しました。' },
  { label: '削除済み', text: 'ご報告ありがとうございます。該当箇所を削除しました。' },
]

export function RespondForm({ reportId, subject, onRespond, loading }: {
  reportId: number
  subject?: string
  onRespond: (id: number, response: string) => void
  loading: boolean
}) {
  const [response, setResponse] = useState('')
  const prefix = subject ? `ご報告いただいた「${subject}」を確認しました。` : ''

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      {prefix && (
        <div className="text-[12px] text-dark-gray px-0.5">
          通知プレビュー: <span className="text-text">{prefix}</span>{response && <span className="text-text">{response}</span>}
        </div>
      )}
      <div className="flex gap-1 flex-wrap">
        {RESPONSE_TEMPLATES.map(t => (
          <button
            key={t.label}
            type="button"
            onClick={() => setResponse(t.text)}
            className="text-[10px] py-0.5 px-2 border border-border rounded-md bg-transparent text-dark-gray cursor-pointer transition-colors duration-200 hover:bg-light-gray hover:text-text"
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 items-end">
        <textarea
          placeholder="追記（任意）"
          value={response}
          onChange={e => setResponse(e.target.value)}
          disabled={loading}
          rows={1}
          className="flex-1 min-w-[120px] py-1.5 px-2.5 text-[13px] resize-y min-h-[32px] max-h-[300px] rounded-md border border-border bg-card-bg text-text"
        />
        <button
          className="bg-accent text-btn-text-on-accent border-none h-8 px-3 cursor-pointer text-xs rounded-md transition-all duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 inline-flex items-center gap-1"
          onClick={() => { onRespond(reportId, response); setResponse('') }}
          disabled={loading}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/></svg>
          {loading ? '送信中...' : '対応'}
        </button>
      </div>
    </div>
  )
}

export function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

const chevronLeft = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
const chevronRight = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>

const navBtn = 'h-9 px-3.5 inline-flex items-center justify-center gap-1.5 text-sm rounded-md cursor-pointer transition-all duration-200 border'
const navBtnActive = navBtn + ' bg-accent text-btn-text-on-accent border-accent hover:opacity-80'
const navBtnDisabled = navBtn + ' bg-transparent text-dark-gray border-border opacity-40 cursor-not-allowed pointer-events-none'
const pageBtn = 'h-9 min-w-[36px] inline-flex items-center justify-center text-sm rounded-md cursor-pointer transition-all duration-200 border'

export function Pagination({ page, totalPages, onPageChange }: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null

  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className="flex justify-center gap-1.5 my-6 items-center flex-wrap">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        className={hasPrev ? navBtnActive : navBtnDisabled}
      >
        {chevronLeft}
        <span className="max-md:hidden">前へ</span>
      </button>

      {generatePageNumbers(page, totalPages).map((p, i) =>
        p === '...'
          ? <span key={`dot-${i}`} className="h-9 px-1 inline-flex items-center text-sm text-dark-gray select-none">…</span>
          : <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={clsx(
                pageBtn,
                p === page
                  ? 'bg-accent text-btn-text-on-accent border-accent font-medium'
                  : 'border-border bg-transparent text-text hover:bg-accent/10 hover:border-accent/30'
              )}
            >{p}</button>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className={hasNext ? navBtnActive : navBtnDisabled}
      >
        <span className="max-md:hidden">次へ</span>
        {chevronRight}
      </button>
    </div>
  )
}
