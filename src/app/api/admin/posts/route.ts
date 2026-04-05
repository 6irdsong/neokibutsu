import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { normalizeSearch } from '@/lib/normalize'
import { isAdmin } from '@/lib/admin'

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ status: 'error', message: '管理者権限がありません' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const q = body.q || ''
  const cat = body.cat || ''
  const page = Math.max(1, parseInt(body.page || '1', 10) || 1)
  const perPage = 20

  const supabase = createServerClient()

  // Strip characters that break .or() parsing
  const normalizedQ = q ? normalizeSearch(q).replace(/[,%.()"'\\]/g, '') : ''

  // Count query
  let countQuery = supabase.from('posts').select('*', { count: 'exact', head: true }).is('deleted_at', null)
  if (normalizedQ) countQuery = countQuery.or(`subject_normalized.ilike.%${normalizedQ}%,teacher_normalized.ilike.%${normalizedQ}%`)
  if (cat) countQuery = countQuery.eq('category', cat)

  const { count: totalCount, error: countError } = await countQuery
  if (countError) {
    console.error(countError)
    return NextResponse.json({ status: 'error', message: '検索に失敗しました' }, { status: 500 })
  }

  const total = totalCount || 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(page, totalPages)

  // Data query
  let dataQuery = supabase.from('posts').select('*').is('deleted_at', null)
  if (normalizedQ) dataQuery = dataQuery.or(`subject_normalized.ilike.%${normalizedQ}%,teacher_normalized.ilike.%${normalizedQ}%`)
  if (cat) dataQuery = dataQuery.eq('category', cat)

  const { data: posts, error: dataError } = await dataQuery
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * perPage, currentPage * perPage - 1)

  if (dataError) {
    console.error(dataError)
    return NextResponse.json({ status: 'error', message: '検索に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({
    posts: posts || [],
    page: currentPage,
    totalPages,
    total,
  })
}
