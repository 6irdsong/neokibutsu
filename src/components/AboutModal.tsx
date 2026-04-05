'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface NotificationItem {
  id: number
  message: string
  created_at: string
}

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
  newsLines: string[]
}

export default function AboutModal({ isOpen, onClose, newsLines }: AboutModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [newsExpanded, setNewsExpanded] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function markAllRead() {
    try {
      await fetch('/api/notifications/read', { method: 'POST' })
      setNotifications([])
    } catch {
      // silent
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-1000 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card-bg w-[90%] max-w-[600px] border border-border rounded-md max-h-[80vh] flex flex-col leading-relaxed text-text relative animate-[fadeIn_0.15s_ease-out]" onClick={e => e.stopPropagation()}>
        {/* Header: close button + title */}
        <div className="flex-shrink-0 px-6 pt-6 pb-0 relative">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-dark-gray hover:bg-light-gray hover:text-text transition-all duration-200" aria-label="閉じる">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <h3 className="text-base font-bold m-0 mb-4">このサイトについて</h3>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 text-sm">
          {notifications.length > 0 && (
            <div className="bg-light-gray border border-gray border-l-4 border-l-accent p-3 mb-5">
              <div className="flex justify-between items-center">
                <div className="text-[11px] font-bold text-dark-gray mb-1.5 uppercase">通知</div>
                <button onClick={markAllRead} className="bg-none border-none text-link cursor-pointer text-xs p-0">すべて既読</button>
              </div>
              <div>
                {notifications.map(n => (
                  <div key={n.id} className="py-3 border-b border-border text-sm leading-relaxed last:border-b-0">
                    <div>{n.message}</div>
                    <div className="text-[11px] text-dark-gray mt-1">{n.created_at}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-light-gray border border-gray border-l-4 border-l-accent p-3 mb-5">
            <div className="text-[11px] font-bold text-dark-gray mb-1.5 uppercase">更新</div>
            <div className="text-[13px] leading-normal text-text">
              {newsLines.length > 0
                ? (newsExpanded ? newsLines : newsLines.slice(0, 2)).map((line, i) => <span key={i}>{line}<br /></span>)
                : '更新情報はありません。'}
            </div>
            {newsLines.length > 2 && (
              <button
                onClick={() => setNewsExpanded(!newsExpanded)}
                className="bg-transparent border-none text-link cursor-pointer text-xs p-0 mt-2"
              >
                {newsExpanded ? '閉じる' : `他 ${newsLines.length - 2} 件を表示`}
              </button>
            )}
          </div>
          <p><strong>■ 制作の経緯</strong><br />サイト「鬼仏表」の荒らし被害および管理人不在に伴い、有志により制作されました。</p>
          <p><strong>■ データの継承</strong><br />旧サイトの講義データは当サイトに移行済みです。また、日次バックアップを実施しています。</p>
          <p><strong>■ ログイン情報の取り扱い</strong><br />Googleログインはブックマーク機能のために使用されます。投稿にアカウントは紐付かず、メールアドレスや氏名も保存しません。ブックマークの管理には暗号化されたハッシュ値のみを使用しており、元のアカウント情報を復元することはできません。安心してご利用ください。</p>
          <hr className="border-0 border-t border-border my-5" />
          <div className="bg-light-gray border border-gray rounded-md p-4 mb-5 text-center">
            <p className="m-0 text-sm leading-relaxed">もし、あなたがこのサイトに単位を救われたなら、コーヒー1杯分だけ、次の誰かの単位のためにサポートをいただけませんか？</p>
            <Link href="/support" onClick={onClose} className="inline-flex items-center gap-1.5 mt-3 px-5 py-2 bg-accent text-btn-text-on-accent text-sm font-medium rounded-md no-underline transition-all duration-200 hover:opacity-80">
              ☕ サポートする
            </Link>
          </div>
          <p className="text-xs text-dark-gray text-center m-0">&copy; 2026 北海道大学NEO鬼仏表 運営</p>
          <p className="text-center mt-2 mb-0">
            <Link href="/contact" onClick={onClose} className="text-link text-sm">連絡はこちら</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// Notification badge component for the about button
export function NotificationBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setCount(data.length))
      .catch(() => {})
  }, [])

  if (count === 0) return null
  return <span className="absolute -top-1 -right-1 bg-[#dc3545] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-[9px] flex items-center justify-center leading-none">{count}</span>
}
