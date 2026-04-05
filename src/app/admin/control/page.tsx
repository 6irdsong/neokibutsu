import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import type { Report, BannedDevice } from '@/lib/types'
import { isAdmin } from '@/lib/admin'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminControlPage() {
  if (!(await isAdmin())) {
    redirect('/')
  }

  const supabase = createServerClient()

  // Fetch counts for summary bar
  const [
    { count: pendingReportCount },
    { count: pendingContactCount },
    { count: banCount },
  ] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true })
      .neq('subject', '管理者への連絡').eq('status', 'pending'),
    supabase.from('reports').select('*', { count: 'exact', head: true })
      .eq('subject', '管理者への連絡').eq('status', 'pending'),
    supabase.from('banned_devices').select('*', { count: 'exact', head: true }),
  ])

  // Fetch banned devices
  const { data: bans } = await supabase
    .from('banned_devices')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch contacts
  const { data: contacts } = await supabase
    .from('reports')
    .select('*')
    .eq('subject', '管理者への連絡')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <AdminDashboard
      contacts={(contacts || []) as Report[]}
      bans={(bans || []) as BannedDevice[]}
      counts={{
        pendingReports: pendingReportCount || 0,
        pendingContacts: pendingContactCount || 0,
        bans: banCount || 0,
      }}
    />
  )
}
