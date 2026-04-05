import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function NotFound() {
  return (
    <>
      <div className="fixed top-5 right-5 z-500 flex items-center gap-2.5 max-md:top-[15px] max-md:right-2.5 max-md:gap-2">
        <ThemeToggle />
      </div>
      <h1>404</h1>
      <p>お探しのページは見つかりませんでした。</p>
      <p><Link href="/" className="text-link">トップページに戻る</Link></p>
    </>
  )
}
