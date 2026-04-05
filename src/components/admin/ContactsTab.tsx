'use client'

import type { Report } from '@/lib/types'
import { RespondForm } from './shared'

export function ContactsTab({ contacts, onRespond, loadingAction }: {
  contacts: Report[]
  onRespond: (id: number, response: string) => void
  loadingAction: string | null
}) {
  return (
    <div className="bg-card-bg border border-border rounded-md p-4">
      <h2 className="m-0 mb-3 text-base">管理者への連絡</h2>
      {contacts.length === 0 ? (
        <div className="text-center py-6 text-dark-gray text-sm">連絡はありません。</div>
      ) : (
        contacts.map(contact => (
          <div key={contact.id} className="py-3 border-b border-border last:border-b-0">
            <div className="flex gap-2.5 items-baseline flex-wrap">
              <span className="text-xs text-dark-gray">#{contact.id}</span>
              <span className="text-xs text-dark-gray">{contact.created_at}</span>
            </div>
            <div className="text-sm text-text mt-1.5 leading-relaxed">{contact.reason}</div>
            {contact.status !== 'pending' && contact.admin_response && (
              <div className="text-xs text-dark-gray mt-1">→ {contact.admin_response}</div>
            )}
            <div className="flex gap-2 items-center flex-wrap mt-2">
              {contact.status === 'pending' ? (
                <RespondForm reportId={contact.id} onRespond={onRespond} loading={loadingAction === `respond-${contact.id}`} />
              ) : (
                <span className="text-[11px] py-0.5 px-2 rounded-[10px] inline-block bg-success-bg text-success">対応済み</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
