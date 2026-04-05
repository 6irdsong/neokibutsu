import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-[50px] border-t border-gray pt-[30px] px-5 pb-[30px] text-center text-dark-gray text-xs">
      <div className="text-sm font-bold text-text mb-2.5">
        NEO鬼仏表 - 北海道大学
      </div>
      <div className="flex justify-center gap-2 mb-2.5 max-md:flex-col max-md:items-center max-md:gap-1.5">
        <a href="mailto:contact@neokibutsu.net" className="text-dark-gray no-underline transition-colors duration-200 hover:text-text">contact@neokibutsu.net</a>
        <span className="text-border max-md:hidden">·</span>
        <div className="flex gap-2">
          <Link href="/terms" className="text-dark-gray no-underline transition-colors duration-200 hover:text-text">利用規約</Link>
          <span className="text-border">·</span>
          <Link href="/privacy" className="text-dark-gray no-underline transition-colors duration-200 hover:text-text">プライバシー</Link>
          <span className="text-border">·</span>
          <Link href="/guidelines" className="text-dark-gray no-underline transition-colors duration-200 hover:text-text">ガイドライン</Link>
          <span className="text-border">·</span>
          <a href="https://github.com/6irdsong/neokibutsu" target="_blank" rel="noopener noreferrer" className="text-dark-gray no-underline transition-colors duration-200 hover:text-text">GitHub</a>
        </div>
      </div>
      <p className="mt-2 mb-0 text-[10px] text-dark-gray opacity-70">
        本サイトのコンテンツの無断転載・スクレイピング・自動収集は<Link href="/terms" className="text-inherit">利用規約</Link>により禁止されています。
      </p>
    </footer>
  )
}
