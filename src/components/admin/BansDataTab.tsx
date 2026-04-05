'use client'

import type { BannedDevice } from '@/lib/types'
import { ActionButton } from './shared'

export function BansDataTab({ bans, onUnban, onExportCSV, loadingAction }: {
  bans: BannedDevice[]
  onUnban: (deviceId: string) => void
  onExportCSV: () => void
  loadingAction: string | null
}) {
  const isExporting = loadingAction === 'export'

  return (
    <div className="space-y-5">
      <div className="bg-card-bg border border-border rounded-md p-4">
        <h2 className="m-0 mb-2 text-base">データ管理</h2>
        <p className="text-[13px] text-dark-gray m-0 mb-2.5">全投稿データをCSV形式（Excel対応）でダウンロード</p>
        <button
          onClick={onExportCSV}
          disabled={isExporting}
          className="bg-accent text-btn-text-on-accent border-none py-[5px] px-3.5 cursor-pointer text-xs rounded-md transition-all duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'エクスポート中...' : 'CSVエクスポート'}
        </button>
      </div>

      <div className="bg-card-bg border border-border rounded-md p-4">
        <h2 className="m-0 mb-2 text-base">追放済み端末リスト</h2>
        <table className="w-full border-collapse mt-3">
          <thead>
            <tr>
              <th className="p-2.5 border-b border-border text-left text-xs text-dark-gray font-semibold">デバイスID</th>
              <th className="p-2.5 border-b border-border text-left text-xs text-dark-gray font-semibold">BAN日時</th>
              <th className="p-2.5 border-b border-border text-left text-xs text-dark-gray font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            {bans.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-6 text-dark-gray text-[13px]">追放されている端末はありません。</td></tr>
            ) : (
              bans.map(ban => (
                <tr key={ban.device_id}>
                  <td className="p-2.5 border-b border-border text-[11px] font-mono break-all">{ban.device_id}</td>
                  <td className="p-2.5 border-b border-border text-[13px] text-dark-gray">{ban.created_at}</td>
                  <td className="p-2.5 border-b border-border">
                    <ActionButton
                      label={loadingAction === `unban-${ban.device_id}` ? '処理中...' : '解除'}
                      onClick={() => onUnban(ban.device_id)}
                      disabled={loadingAction === `unban-${ban.device_id}`}
                      variant="delete"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
