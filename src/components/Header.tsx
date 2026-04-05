'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import clsx from 'clsx'
import ThemeToggle from './ThemeToggle'
import AboutModal, { NotificationBadge } from './AboutModal'
import AuthButton from './AuthButton'
import PostForm from './PostForm'

interface HeaderProps {
  newsLines: string[]
}

export default function Header({ newsLines }: HeaderProps) {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [postOpen, setPostOpen] = useState(false)
  const [postClosing, setPostClosing] = useState(false)
  const router = useRouter()
  const isMainPage = usePathname() === '/'

  const closePost = useCallback(() => {
    setPostClosing(true)
    setTimeout(() => {
      setPostOpen(false)
      setPostClosing(false)
    }, 200)
  }, [])

  useEffect(() => {
    document.body.style.overflow = postOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [postOpen])

  return (
    <>
      <header className="sticky top-0 z-50 bg-bg border-b-[4px] border-accent pt-4 pb-4 mx-[-20px] px-[20px] flex items-center justify-between gap-3 max-md:flex-col max-md:items-stretch max-md:pt-3 max-md:pb-3 max-md:gap-2 max-md:mx-[-10px] max-md:px-[14px]">
        <div className="flex items-center gap-5">
          <a href="/" className="no-underline text-text">
            <h1 className="site-title m-0 leading-tight whitespace-nowrap py-1 text-[1.875rem] max-md:text-[1.9rem]">
              北海道大学 NEO鬼仏表
            </h1>
          </a>
          {isMainPage && (
            <button
              onClick={() => setPostOpen(true)}
              className="shrink-0 h-[42px] px-5 bg-accent text-btn-text-on-accent border border-[var(--accent-border)] cursor-pointer font-normal rounded-md shadow-none transition-all duration-200 hover:opacity-80 inline-flex items-center gap-1.5 max-md:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
              </svg>
              投稿する
            </button>
          )}
        </div>
        <div className={clsx('flex items-center gap-2.5 max-md:gap-2', !isMainPage && 'max-md:ml-auto')}>
          {/* Mobile post + search buttons (main page only) */}
          {isMainPage && (
            <>
              <button
                onClick={() => setPostOpen(true)}
                className="hidden max-md:inline-flex max-md:h-[42px] px-3 bg-accent text-btn-text-on-accent border border-[var(--accent-border)] cursor-pointer font-normal rounded-md shadow-none transition-all duration-200 hover:opacity-80 items-center gap-1 text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                </svg>
                投稿する
              </button>
              <button
                onClick={() => {
                  const current = localStorage.getItem('searchOpen') === 'true'
                  const next = !current
                  localStorage.setItem('searchOpen', String(next))
                  window.dispatchEvent(new CustomEvent('searchToggle', { detail: next }))
                }}
                className="hidden max-md:inline-flex max-md:h-[42px] px-3 bg-card-bg text-text border border-border cursor-pointer font-normal rounded-md shadow-none transition-all duration-200 hover:opacity-80 items-center gap-1 text-sm mr-auto"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                検索する
              </button>
            </>
          )}
          <ThemeToggle />
          <div className="relative">
            <button
              className="h-[42px] px-5 bg-card-bg text-text border border-border cursor-pointer font-normal rounded-md shadow-none transition-all duration-200 inline-flex items-center max-lg:w-[42px] max-lg:p-0 max-lg:rounded-full max-lg:justify-center max-lg:text-[0] max-md:w-[46px] max-md:h-[46px]"
              onClick={() => setAboutOpen(true)}
            >
              <span className="max-lg:hidden">このサイトについて</span>
              <svg className="hidden max-lg:!block" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <NotificationBadge />
            </button>
          </div>
          <AuthButton />
        </div>
      </header>

      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} newsLines={newsLines} />

      {/* Fullscreen post overlay */}
      {postOpen && (
        <div
          className="fixed inset-0 z-[999] bg-bg overflow-y-auto pb-[env(safe-area-inset-bottom)]"
          style={{ animation: `${postClosing ? 'overlayOut' : 'overlayIn'} 0.25s ease-out forwards` }}
        >
          <div className="max-w-[900px] mx-auto px-8 py-10 max-md:px-5 max-md:py-6 max-md:pb-[env(safe-area-inset-bottom,20px)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                </svg>
                <h2 className="m-0 text-2xl font-bold">投稿する</h2>
              </div>
              <button
                onClick={closePost}
                className="h-10 px-4 bg-transparent text-text border-none cursor-pointer rounded-md inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-dark-gray text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
                <span className="max-md:hidden">閉じる</span>
              </button>
            </div>
            <PostForm
              alwaysOpen
              onPostSuccess={() => {
                closePost()
                setTimeout(() => router.refresh(), 250)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
