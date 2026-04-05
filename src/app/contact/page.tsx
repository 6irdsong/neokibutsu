'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!message.trim()) {
      alert('メッセージを入力してください')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        alert('送信しました。')
        setMessage('')
      } else {
        alert('エラーが発生しました: ' + data.message)
      }
    } catch {
      alert('送信に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <h1 className="text-2xl font-bold m-0 mt-4 mb-4 max-md:px-1">連絡</h1>

      <div className="leading-[1.8] text-sm max-md:px-4">
        <p>管理者へ直接メッセージを送信できます。ご要望・ご質問・不具合のご報告・ご感想など、お気軽にお寄せください。</p>

        <textarea
          className="w-full min-h-[120px] p-3 border border-border rounded-md bg-card-bg text-text text-sm leading-relaxed resize-y mt-4"
          placeholder="メッセージを入力してください"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-accent text-btn-text-on-accent border-none py-2 px-5 cursor-pointer text-sm rounded-md shadow-none transition-all duration-200 hover:not-disabled:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none mt-2"
          disabled={submitting}
        >
          {submitting ? '送信中...' : '送信'}
        </button>

        <hr className="border-0 border-t border-border my-6" />
        <p className="text-center">
          <Link href="/" className="text-dark-gray">トップページに戻る</Link>
        </p>
      </div>
    </main>
  )
}
