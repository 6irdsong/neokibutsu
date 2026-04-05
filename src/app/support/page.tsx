import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'サポート - NEO鬼仏表',
  robots: { index: false, follow: true },
}

const methods = [
  {
    href: 'https://ofuse.me/neokibutsunet',
    name: 'OFUSE',
    description: '100円から・コンビニ決済OK',
    tags: ['クレジットカード', 'コンビニ決済'],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#E96DB0]">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: 'https://buymeacoffee.com/neokibutsu',
    name: 'Buy Me a Coffee',
    description: 'クレジットカードで支援',
    tags: ['クレジットカード', 'PayPal'],
    icon: <span className="text-xl leading-none">☕</span>,
  },
  {
    href: 'https://www.amazon.co.jp/dp/B004N3APGO',
    name: 'Amazonギフト券',
    description: 'Eメールタイプを donate@neokibutsu.net 宛に送信',
    tags: ['Amazonアカウント'],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF9900]">
        <rect x="3" y="8" width="18" height="12" rx="2" /><path d="M12 8V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3" /><path d="M8 8V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3" />
      </svg>
    ),
  },
]

export default function SupportPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold m-0 mt-4 mb-4 max-md:px-1">サポートのお願い</h1>

      <div className="leading-[1.8] text-sm max-md:px-4">
        <p>もし、あなたがこのサイトに単位を救われたなら、コーヒー1杯分だけ、次の誰かの単位のためにサポートをいただけませんか？</p>

        <div className="flex flex-col gap-3 mt-6">
          {methods.map(m => (
            <a
              key={m.name}
              href={m.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-card-bg border border-border rounded-lg no-underline text-text transition-all duration-200 hover:border-accent"
            >
              <div className="w-10 h-10 rounded-full bg-light-gray flex items-center justify-center shrink-0">
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{m.name}</div>
                <div className="text-xs text-dark-gray mt-0.5">{m.description}</div>
                <div className="flex gap-1.5 mt-1.5">
                  {m.tags.map(tag => (
                    <span key={tag} className="text-[10px] py-0.5 px-1.5 rounded bg-light-gray text-dark-gray">{tag}</span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>

        <p className="text-xs text-dark-gray mt-6 text-center">いただいた支援はサーバー代・ドメイン維持費などの運営費に充てさせていただきます。</p>

        <hr className="border-0 border-t border-border my-6" />
        <p className="text-center">
          <Link href="/" className="text-dark-gray">トップページに戻る</Link>
        </p>
      </div>
    </main>
  )
}
