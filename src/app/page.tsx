import type { Metadata } from 'next'
import { createPublicServerClient } from '@/lib/supabase'
import { isAdmin as checkAdmin } from '@/lib/admin'
import { normalizeSearch } from '@/lib/normalize'
import { POST_PUBLIC_COLUMNS } from '@/lib/columns'
import type { Post } from '@/lib/types'
import PostList from '@/components/PostList'
import Footer from '@/components/Footer'

export const revalidate = 30

interface SearchParams {
  sub_q?: string
  tea_q?: string
  cat?: string
  page?: string
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10) || 1
  const hasQuery = !!(params.sub_q || params.tea_q || (params.cat && params.cat !== 'all'))

  if (page > 1 || hasQuery) {
    return { robots: { index: false, follow: true } }
  }
  return {}
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const subQ = params.sub_q || ''
  const teaQ = params.tea_q || ''
  const cat = params.cat || 'all'
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const perPage = 50

  const supabase = createPublicServerClient()

  // Build queries
  let countQ = supabase.from('posts').select('*', { count: 'exact', head: true }).is('deleted_at', null)
  let dataQ = supabase.from('posts').select(POST_PUBLIC_COLUMNS).is('deleted_at', null)
  if (cat !== 'all') { countQ = countQ.eq('category', cat); dataQ = dataQ.eq('category', cat) }
  if (subQ) { countQ = countQ.ilike('subject_normalized', `%${normalizeSearch(subQ)}%`); dataQ = dataQ.ilike('subject_normalized', `%${normalizeSearch(subQ)}%`) }
  if (teaQ) { countQ = countQ.ilike('teacher_normalized', `%${normalizeSearch(teaQ)}%`); dataQ = dataQ.ilike('teacher_normalized', `%${normalizeSearch(teaQ)}%`) }
  dataQ = dataQ.order('id', { ascending: false }).range((page - 1) * perPage, page * perPage - 1)

  // Run all queries in parallel
  const [isAdmin, { count }, { data, error }] = await Promise.all([
    checkAdmin(),
    countQ,
    dataQ,
  ])

  const totalPages = Math.max(1, Math.ceil((count || 0) / perPage))
  const hasNext = page < totalPages
  const posts: Post[] = (!error && data) ? data as Post[] : []

  return (
    <>
      {isAdmin && <script dangerouslySetInnerHTML={{ __html: "document.body.classList.add('admin-mode')" }} />}

      <main>
        <PostList
          initialPosts={posts}
          initialPage={page}
          initialHasNext={hasNext}
          initialTotalPages={totalPages}
          initialSubQ={subQ}
          initialTeaQ={teaQ}
          initialCat={cat}
          isAdmin={false}
        />
      </main>

      <Footer />
    </>
  )
}
