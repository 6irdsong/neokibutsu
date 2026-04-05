'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Post } from '@/lib/types'
import { useToast } from './Toast'
import { useAuth } from './AuthProvider'

const MIN_REASON_LENGTH = 10

const REPORT_CATEGORIES = [
  '誹謗中傷',
  '個人情報の掲載',
  '虚偽の情報',
  'スパム・荒らし',
  'その他',
] as const

type ReportCategory = typeof REPORT_CATEGORIES[number]

const CATEGORY_PLACEHOLDERS: Record<ReportCategory, string> = {
  '誹謗中傷': '該当する箇所と、なぜ誹謗中傷にあたると考えるかを記入してください',
  '個人情報の掲載': '掲載されている個人情報の内容を記入してください',
  '虚偽の情報': 'どの記述がどのように事実と異なるか、具体的に記入してください',
  'スパム・荒らし': 'スパム・荒らしの内容を記入してください',
  'その他': '通報の理由を具体的に記入してください',
}

interface ReportModalProps {
  post: Post | null
  onClose: () => void
}

export default function ReportModal({ post, onClose }: ReportModalProps) {
  const toast = useToast()
  const { user } = useAuth()
  const [category, setCategory] = useState<ReportCategory | ''>('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!post) return null

  function handleClose() {
    setCategory('')
    setReason('')
    onClose()
  }

  async function handleSubmit() {
    if (!post) return
    if (!category) {
      toast.error('通報理由のカテゴリを選択してください')
      return
    }
    const trimmed = reason.trim()
    if (trimmed.length < MIN_REASON_LENGTH) {
      toast.error(`理由は${MIN_REASON_LENGTH}文字以上で入力してください`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          subject: post.subject,
          category,
          reason: trimmed,
          date: post.date,
          author: post.author,
        }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        toast.success('通報を受け付けました。')
        handleClose()
      } else {
        toast.error(data.message || 'エラーが発生しました')
      }
    } catch {
      toast.error('送信に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-1000 flex items-center justify-center" onClick={handleClose}>
      <div className="bg-card-bg w-[90%] max-w-[560px] p-6 border border-border rounded-md text-text animate-[fadeIn_0.15s_ease-out]" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold m-0 mb-4">通報フォーム</h3>
        <p className="text-sm text-text/80 m-0 mb-4 leading-relaxed">
          通報の理由を具体的に記入してください。
        </p>

        <label className="block text-xs text-dark-gray font-medium mb-1">カテゴリ</label>
        <select
          className="w-full py-2 px-3 text-sm rounded-md border border-border bg-card-bg text-text mb-4"
          value={category}
          onChange={e => setCategory(e.target.value as ReportCategory)}
        >
          <option value="" disabled>選択してください</option>
          {REPORT_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label className="block text-xs text-dark-gray font-medium mb-1">詳細</label>
        <textarea
          className="w-full min-h-[100px] resize-y py-2 px-3 text-sm rounded-md border border-border bg-card-bg text-text"
          placeholder={category ? CATEGORY_PLACEHOLDERS[category] : '通報理由のカテゴリを選択してください'}
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="text-right text-xs text-dark-gray mt-1 mb-4">
          {reason.trim().length}/{MIN_REASON_LENGTH}文字以上
        </div>
        {user ? (
          <p className="text-xs text-dark-gray m-0 mb-2">対応結果はお知らせから確認できます。（管理者が通報者アカウントを特定することはできません）</p>
        ) : (
          <p className="text-xs text-dark-gray m-0 mb-2">通報前にログインすると対応結果をお知らせから確認できます。（ログインしても管理者が通報者を特定することはできません）</p>
        )}
        <div className="flex gap-2.5 justify-between items-center">
          <Link href="/guidelines" target="_blank" className="text-xs text-dark-gray underline underline-offset-2 hover:text-text transition-colors duration-200">ガイドライン</Link>
          <div className="flex gap-2.5">
          <button type="button" onClick={handleClose} className="py-2 px-4 bg-transparent text-text border border-border cursor-pointer text-sm rounded-md transition-colors duration-200 hover:bg-light-gray">キャンセル</button>
          <button type="button" onClick={handleSubmit} disabled={submitting || !category || reason.trim().length < MIN_REASON_LENGTH} className="py-2 px-5 bg-accent text-btn-text-on-accent border-none cursor-pointer text-sm rounded-md transition-all duration-200 hover:not-disabled:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none">
            {submitting ? '送信中...' : '送信'}
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}
