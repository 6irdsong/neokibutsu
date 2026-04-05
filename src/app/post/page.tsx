'use client'

import { useRouter } from 'next/navigation'
import PostForm from '@/components/PostForm'

export default function PostPage() {
  const router = useRouter()

  return (
    <main>
      <PostForm onPostSuccess={() => router.push('/')} alwaysOpen />
    </main>
  )
}
