import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getDeviceId, getClientIp } from '@/lib/device-id'
import { normalizeSearch } from '@/lib/normalize'
import { formatDatetime } from '@/lib/format'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const formData = await request.formData()

  if (formData.get('honeypot')) {
    return NextResponse.json({ status: 'success' })
  }

  const deviceId = await getDeviceId()
  const clientIp = getClientIp(request)
  const now = new Date()

  const supabase = createServerClient()

  if (deviceId) {
    const { data: banned } = await supabase
      .from('banned_devices')
      .select('device_id')
      .eq('device_id', deviceId)
      .single()

    if (banned) {
      return NextResponse.json({
        status: 'error',
        message: '不適切な利用により、あなたの端末からの投稿は制限されています。',
      }, { status: 403 })
    }

    if (await isRateLimited(supabase, 'posts', 'device_id', deviceId, 60000)) {
      return NextResponse.json({
        status: 'error',
        message: '連投制限中です。1分ほど時間を置いてから再度投稿してください。',
      }, { status: 429 })
    }
  }

  const subject = (formData.get('subject') as string || '').replace(/\u3000/g, ' ').trim()
  const teacher = (formData.get('teacher') as string || '').replace(/\u3000/g, ' ').trim()
  const category = formData.get('category') as string

  const author = (formData.get('author') as string || '').trim()
  const comment = (formData.get('comment') as string || '').trim()
  const rating = formData.get('rating') as string
  const test = formData.get('test') as string
  const report = formData.get('report') as string
  const attendance = formData.get('attendance') as string
  const assignment = formData.get('assignment') as string

  if (!subject) {
    return NextResponse.json({ status: 'error', message: '講義名を入力してください。' }, { status: 400 })
  }
  if (!teacher) {
    return NextResponse.json({ status: 'error', message: '教員名を入力してください。' }, { status: 400 })
  }
  if (!category || !['全学教育科目', '専門科目'].includes(category)) {
    return NextResponse.json({ status: 'error', message: '科目区分を選択してください。' }, { status: 400 })
  }

  if (subject.length > 200) {
    return NextResponse.json({ status: 'error', message: '講義名が長すぎます（200文字以内）。' }, { status: 400 })
  }
  if (teacher.length > 100) {
    return NextResponse.json({ status: 'error', message: '教員名が長すぎます（100文字以内）。' }, { status: 400 })
  }
  if (author.length > 50) {
    return NextResponse.json({ status: 'error', message: '投稿者名が長すぎます（50文字以内）。' }, { status: 400 })
  }
  if (comment.length > 5000) {
    return NextResponse.json({ status: 'error', message: 'コメントが長すぎます（5000文字以内）。' }, { status: 400 })
  }
  const selectFields = [rating, test, report, attendance, assignment]
  if (selectFields.some(f => f && f.length > 50)) {
    return NextResponse.json({ status: 'error', message: '選択項目の値が不正です。' }, { status: 400 })
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${now.getFullYear()}年${pad(now.getMonth() + 1)}月${pad(now.getDate())}日`
  const createdAt = formatDatetime(now)

  const { error } = await supabase.from('posts').insert({
    date: dateStr,
    subject,
    teacher,
    subject_normalized: normalizeSearch(subject),
    teacher_normalized: normalizeSearch(teacher),
    author: author || '匿名',
    rating,
    test,
    report,
    attendance,
    assignment,
    comment,
    ip: clientIp,
    created_at: createdAt,
    device_id: deviceId,
    category,
  })

  if (error) {
    console.error(error)
    return NextResponse.json({ status: 'error', message: '投稿時にエラーが発生しました。' }, { status: 500 })
  }

  return NextResponse.json({ status: 'success', message: '投稿しました。' })
}
