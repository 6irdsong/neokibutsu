'use client'

import { useState, useRef, useCallback } from 'react'
import { useToast } from './Toast'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import clsx from 'clsx'

interface PostFormProps {
  onPostSuccess?: () => void
  alwaysOpen?: boolean
}

export default function PostForm({ onPostSuccess, alwaysOpen }: PostFormProps) {
  const toast = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [formOpen, setFormOpen] = useState(alwaysOpen ?? false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState(false)

  const validateForm = useCallback(() => {
    if (!formRef.current) return
    const form = formRef.current
    const subject = (form.elements.namedItem('subject') as HTMLInputElement)?.value.trim()
    const teacher = (form.elements.namedItem('teacher') as HTMLInputElement)?.value.trim()
    const rating = (form.elements.namedItem('rating') as HTMLSelectElement)?.value
    const category = (form.elements.namedItem('category') as HTMLSelectElement)?.value
    const comment = (form.elements.namedItem('comment') as HTMLTextAreaElement)?.value.trim()
    setIsValid(!!(subject && teacher && rating !== '--' && category !== '--' && comment))
  }, [])

  async function handleSubmit() {
    if (!formRef.current) return
    setSubmitting(true)
    const formData = new FormData(formRef.current)
    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.status === 'success') {
        setShowConfirm(false)
        formRef.current.reset()
        setIsValid(false)
        setSuccessMsg(true)
        setTimeout(() => setSuccessMsg(false), 3000)
        onPostSuccess?.()
      } else {
        toast.error(data.message || 'エラーが発生しました')
      }
    } catch {
      toast.error('送信に失敗しました')
    } finally {
      setSubmitting(false)
      setShowConfirm(false)
    }
  }

  const inputClass = 'w-full py-2 px-3 border border-border rounded-md bg-card-bg text-text text-base outline-none transition-[border-color,box-shadow] duration-200 focus:border-accent focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)]'
  const labelClass = 'flex flex-col gap-0.5 text-xs text-dark-gray font-medium'
  const selectWrapClass = 'flex flex-col gap-0.5 text-xs text-dark-gray font-medium flex-1'

  return (
    <>
      {!alwaysOpen && (
        <button
          id="toggle-form-btn"
          className="hidden max-md:flex w-full p-2.5 mb-[18px] cursor-pointer bg-light-gray border border-border font-normal text-sm text-text rounded-md items-center justify-center gap-1.5"
          onClick={() => setFormOpen(!formOpen)}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={clsx('transition-transform duration-200', formOpen ? 'rotate-180' : 'rotate-0')}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
          {formOpen ? '投稿フォームを閉じる' : '投稿フォームを開く'}
        </button>
      )}

      <div className={clsx(
        'bg-card-bg p-6 border border-border rounded-lg max-md:p-0 max-md:border-0 max-md:rounded-none max-md:bg-bg',
        !alwaysOpen && 'mb-[18px] bg-light-bg',
        !alwaysOpen && 'max-md:hidden',
        !alwaysOpen && formOpen && 'max-md:!block max-md:animate-[fadeIn_0.2s_ease-out]'
      )}>
        {!alwaysOpen && <h2 className="mt-0 mb-[15px]">投稿フォーム</h2>}

        {successMsg && (
          <div className="mb-4 py-2.5 px-4 bg-success-bg text-success text-sm rounded-md border border-success/20 animate-[fadeIn_0.2s_ease-out]">
            投稿が完了しました
          </div>
        )}

        <form ref={formRef} onInput={validateForm} onChange={validateForm}>
          <input type="checkbox" name="honeypot" style={{ display: 'none' }} />

          {/* Section 1: Basic info */}
          <div className="flex gap-3 mb-4 max-md:flex-col max-md:gap-3">
            <div className={clsx(labelClass, 'flex-[2]')}>
              <span>講義名 <span className="text-red-400">*</span></span>
              <input type="text" name="subject" placeholder="例：微分積分学I" required className={inputClass} aria-label="講義名" />
            </div>
            <div className={clsx(labelClass, 'flex-[1.2]')}>
              <span>教員名 <span className="text-red-400">*</span></span>
              <input type="text" name="teacher" placeholder="例：山田太郎" className={inputClass} aria-label="教員名" required />
            </div>
            <div className={clsx(labelClass, 'flex-1')}>
              <span>投稿者名</span>
              <input type="text" name="author" placeholder="匿名" className={inputClass} aria-label="投稿者名" />
            </div>
          </div>

          {/* Section 2: Rating & Category */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={selectWrapClass}>
              <span>評価 <span className="text-red-400">*</span></span>
              <select name="rating" defaultValue="--">
                <option value="--" disabled hidden>選択してください</option>
                <option value="ど仏">ど仏</option>
                <option value="仏">仏</option>
                <option value="やや仏">やや仏</option>
                <option value="並">並</option>
                <option value="やや鬼">やや鬼</option>
                <option value="鬼">鬼</option>
                <option value="ど鬼">ど鬼</option>
              </select>
            </div>
            <div className={selectWrapClass}>
              <span>科目区分 <span className="text-red-400">*</span></span>
              <select name="category" defaultValue="--">
                <option value="--" disabled hidden>選択してください</option>
                <option value="全学教育科目">全学教育科目</option>
                <option value="専門科目">専門科目（2年次以降）</option>
              </select>
            </div>
          </div>

          {/* Section 3: Details (2x2 grid) */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={selectWrapClass}>
              テスト
              <select name="test" defaultValue="--">
                <option value="--">--</option>
                <option value="なし">なし</option>
                <option value="あり(中間/期末)">あり（中間/期末）</option>
                <option value="あり(期末のみ)">あり（期末のみ）</option>
              </select>
            </div>
            <div className={selectWrapClass}>
              課題
              <select name="assignment" defaultValue="--">
                <option value="--">--</option>
                <option value="あり">あり</option>
                <option value="なし">なし</option>
              </select>
            </div>
            <div className={selectWrapClass}>
              レポート
              <select name="report" defaultValue="--">
                <option value="--">--</option>
                <option value="なし">なし</option>
                <option value="あり(小レポート)">あり（小レポート）</option>
                <option value="あり(期末レポート)">あり（期末レポート）</option>
              </select>
            </div>
            <div className={selectWrapClass}>
              出席
              <select name="attendance" defaultValue="--">
                <option value="--">--</option>
                <option value="なし">なし</option>
                <option value="あり(コード)">あり（コード）</option>
                <option value="あり(リアペ)">あり（リアペ）</option>
                <option value="あり(小テスト)">あり（小テスト）</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>

          {/* Section 4: Comment */}
          <div className={clsx(labelClass, 'mb-4')}>
            <span>コメント <span className="text-red-400">*</span></span>
            <textarea name="comment" placeholder="授業の雰囲気や単位の取りやすさなど、自由にコメントしてください" className="min-h-[120px] max-md:min-h-[80px]" />
          </div>

          {/* Submit row - sticky on mobile */}
          <div className="mt-5 flex justify-between items-center max-md:sticky max-md:bottom-0 max-md:bg-bg max-md:py-3 max-md:border-t max-md:border-border max-md:-mx-0 max-md:z-10">
            <Link href="/guidelines" target="_blank" className="text-dark-gray text-sm underline underline-offset-2 hover:text-text transition-colors duration-200 shrink-0">ガイドライン</Link>
            <button
              type="button"
              className="h-12 px-8 bg-accent text-btn-text-on-accent border-none cursor-pointer text-base font-medium rounded-lg shadow-none transition-all duration-200 hover:not-disabled:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
              disabled={!isValid}
              onClick={() => setShowConfirm(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
              </svg>
              投稿する
            </button>
          </div>
        </form>
      </div>

      {/* Post Confirm Modal - portaled to body */}
      {showConfirm && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-card-bg w-full max-w-[600px] p-[30px] border border-border rounded-md shadow-none max-h-[80vh] overflow-y-auto leading-relaxed text-text relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-[1.2rem] border-b-2 border-accent pb-2.5">投稿確認</h2>
            <div className="my-5 text-sm">
              <p>誹謗中傷や個人を特定する情報はありませんか？</p>
              <p>一度投稿すると自分で削除することはできません。</p>
              <p>投稿することで<a href="/terms" target="_blank" className="text-inherit">利用規約</a>に同意したものとみなされます。</p>
            </div>
            <div className="flex gap-2.5 justify-center mt-[30px]">
              <button type="button" onClick={() => setShowConfirm(false)} className="bg-transparent text-text border border-border py-2 px-5 cursor-pointer text-sm rounded-md transition-all duration-200 hover:bg-light-gray">戻る</button>
              <button type="button" onClick={handleSubmit} disabled={submitting} className="bg-accent text-btn-text-on-accent border-none py-2 px-5 cursor-pointer text-sm rounded-md shadow-none transition-all duration-200 hover:not-disabled:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none">
                {submitting ? '送信中...' : '同意して投稿'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
