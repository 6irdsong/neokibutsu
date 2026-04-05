'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim())

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="inline-block align-middle -mt-px mr-1.5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function GoogleIconMobile({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const btnBase = 'h-[42px] px-5 bg-card-bg text-text border border-border cursor-pointer font-normal rounded-md shadow-none transition-all duration-200 inline-flex items-center max-md:w-[46px] max-md:h-[46px] max-md:p-0 max-md:rounded-full max-md:justify-center max-md:shadow-none'

export default function AuthButton() {
  const { user, loading, signInWithGoogle, signOut, showLoginModal, setShowLoginModal } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email)

  if (loading) return null

  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''

    return (
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={btnBase + ' !p-0 !w-[42px] !h-[42px] !rounded-full overflow-hidden hover:!border-accent/50'}
          title={name}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-sm font-bold text-accent bg-accent/10">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-400" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-[48px] bg-card-bg border border-border rounded-md shadow-lg z-500 py-1">
              {isAdmin && (
                <button
                  onClick={() => { setMenuOpen(false); router.push('/admin/control') }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-text bg-transparent border-none cursor-pointer hover:bg-light-gray transition-colors whitespace-nowrap w-full"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  管理者ページ
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); signOut() }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-text bg-transparent border-none cursor-pointer hover:bg-light-gray transition-colors whitespace-nowrap w-full"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                ログアウト
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowLoginModal(true)}
        className={btnBase}
        title="北大アカウントでログイン"
      >
        <span className="max-lg:hidden"><GoogleIcon size={16} />北大アカウントでログイン</span>
        <span className="hidden max-lg:!inline-flex max-md:!hidden items-center"><GoogleIcon size={16} />ログイン</span>
        <span className="hidden max-md:!block"><GoogleIconMobile size={20} /></span>
      </button>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-1000 flex items-center justify-center" onClick={() => setShowLoginModal(false)}>
          <div className="bg-card-bg w-[90%] max-w-[420px] p-6 border border-border rounded-md text-text animate-[fadeIn_0.15s_ease-out]" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold m-0 mb-4">北大Googleアカウントでログイン</h3>
            <p className="text-sm text-text/80 m-0 mb-2 leading-relaxed">
              ログインするとブックマーク機能が使えるほか、通報への対応結果をお知らせから確認できるようになります。
            </p>
            <p className="text-xs text-dark-gray m-0 mb-4">
              （末尾が @elms.hokudai.ac.jp のアカウントのみ利用可能です）
            </p>
            <ul className="list-none p-0 m-0 mb-4 flex flex-col gap-2">
              <li className="flex items-start gap-2 text-sm text-text/80">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent"><path d="M20 6 9 17l-5-5"/></svg>
                アカウント情報（メールアドレス・氏名）はサーバーに保存されません
              </li>
              <li className="flex items-start gap-2 text-sm text-text/80">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent"><path d="M20 6 9 17l-5-5"/></svg>
                サイト上の機能には暗号化されたハッシュ値のみを使用し、元のアカウント情報を復元することはできません
              </li>
              <li className="flex items-start gap-2 text-sm text-text/80">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent"><path d="M20 6 9 17l-5-5"/></svg>
                通報しても、管理者が通報者を特定することはできません
              </li>
            </ul>
            <p className="text-xs text-dark-gray m-0 mb-5">
              ログイン情報が他のユーザーに公開されることはありません。
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowLoginModal(false)}
                className="py-2 px-4 bg-transparent text-text border border-border cursor-pointer text-sm rounded-md transition-colors duration-200 hover:bg-light-gray"
              >
                キャンセル
              </button>
              <button
                onClick={() => { setShowLoginModal(false); signInWithGoogle() }}
                className="py-2 px-5 bg-accent text-btn-text-on-accent border-none cursor-pointer text-sm rounded-md transition-all duration-200 hover:opacity-80 flex items-center gap-1.5"
              >
                <GoogleIcon size={16} />ログイン
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
