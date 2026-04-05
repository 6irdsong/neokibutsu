'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import type { Report, BannedDevice } from '@/lib/types'
import ThemeToggle from '@/components/ThemeToggle'
import { ToastProvider, useToast } from '@/components/Toast'
import { ConfirmProvider, useConfirm } from '@/components/ConfirmDialog'
import { ContactsTab } from '@/components/admin/ContactsTab'
import { PostsTab } from '@/components/admin/PostsTab'
import { BansDataTab } from '@/components/admin/BansDataTab'

interface AdminDashboardProps {
  contacts: Report[]
  bans: BannedDevice[]
  counts: {
    pendingReports: number
    pendingContacts: number
    bans: number
  }
}

export default function AdminDashboard(props: AdminDashboardProps) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <DashboardContent {...props} />
      </ConfirmProvider>
    </ToastProvider>
  )
}

type TabId = 'posts' | 'contacts' | 'bans'

const TABS: { id: TabId; label: string }[] = [
  { id: 'posts', label: '投稿管理' },
  { id: 'contacts', label: '連絡' },
  { id: 'bans', label: 'BAN/データ' },
]

function DashboardContent({
  contacts, bans, counts,
}: AdminDashboardProps) {
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [activeTab, setActiveTab] = useState<TabId>('posts')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const withLoading = useCallback(async (key: string, fn: () => Promise<void>) => {
    setLoadingAction(key)
    try { await fn() } finally { setLoadingAction(null) }
  }, [])

  async function handleRespond(reportId: number, response: string) {
    await withLoading(`respond-${reportId}`, async () => {
      const res = await fetch('/api/admin/report/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, admin_response: response }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        toast.success('返信を送信しました')
        router.refresh()
      } else {
        toast.error(data.message || 'エラーが発生しました')
      }
    })
  }

  async function handleUnban(deviceId: string) {
    const ok = await confirm({
      title: 'BAN解除',
      message: 'この端末のBANを解除しますか？',
      confirmLabel: '解除する',
    })
    if (!ok) return
    await withLoading(`unban-${deviceId}`, async () => {
      const res = await fetch('/api/admin/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        toast.success('BAN解除しました')
        router.refresh()
      } else {
        toast.error(data.message)
      }
    })
  }

  async function handleExportCSV() {
    await withLoading('export', async () => {
      const res = await fetch('/api/admin/export-csv', { method: 'POST' })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'neokibutsu_export.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSVをダウンロードしました')
    })
  }

  return (
    <>
      <div className="fixed top-5 right-5 z-500 flex items-center gap-2.5 max-md:top-[15px] max-md:right-2.5 max-md:gap-2">
        <ThemeToggle />
      </div>

      <div className="max-w-[960px] mx-auto p-4">
        <div className="flex justify-between items-center mb-0">
          <h1 className="m-0 grow">管理画面</h1>
        </div>

        {/* Summary bar */}
        <div className="flex gap-4 text-[12px] text-dark-gray mt-2 mb-3 flex-wrap">
          <span>未対応通報: <strong className="text-text">{counts.pendingReports}件</strong></span>
          <span>未対応連絡: <strong className="text-text">{counts.pendingContacts}件</strong></span>
          <span>BAN: <strong className="text-text">{counts.bans}件</strong></span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {TABS.map(tab => {
            const badge = tab.id === 'posts' ? counts.pendingReports
              : tab.id === 'contacts' ? counts.pendingContacts
              : null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'py-1.5 px-4 text-[13px] border cursor-pointer rounded-md transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-accent text-btn-text-on-accent border-[var(--accent-border)]'
                    : 'bg-transparent text-dark-gray border-border hover:text-text'
                )}
              >
                {tab.label}
                {badge != null && badge > 0 && (
                  <span className="ml-1.5 bg-[#d9534f] text-white text-[10px] py-0.5 px-1.5 rounded-full">{badge}</span>
                )}
              </button>
            )
          })}
        </div>

        {activeTab === 'contacts' && (
          <ContactsTab
            contacts={contacts}
            onRespond={handleRespond}
            loadingAction={loadingAction}
          />
        )}

        {activeTab === 'posts' && <PostsTab />}

        {activeTab === 'bans' && (
          <BansDataTab
            bans={bans}
            onUnban={handleUnban}
            onExportCSV={handleExportCSV}
            loadingAction={loadingAction}
          />
        )}

        <div className="mt-[30px] pt-5 border-t border-border">
          <Link href="/" className="no-underline text-xs py-2 px-5 border border-border cursor-pointer rounded-sm transition-all duration-200 inline-flex items-center justify-center font-medium bg-transparent text-dark-gray hover:bg-light-gray hover:text-text">メインページに戻る</Link>
        </div>
      </div>
    </>
  )
}
