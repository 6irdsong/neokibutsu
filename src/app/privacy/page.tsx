import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'プライバシーポリシー - NEO鬼仏表',
  robots: 'noindex, nofollow',
}

export default function PrivacyPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold m-0 mt-4 mb-4 max-md:px-1">プライバシーポリシー</h1>

      <div className="bg-card-bg border border-border rounded-md p-6 max-md:p-4 leading-[1.8] text-sm [&_h2]:mt-6 [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-1.5 [&_ol_li]:mb-1.5">
        <p className="text-dark-gray text-[13px]">最終更新日: 2026年2月26日</p>

        <p>NEO鬼仏表（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。本プライバシーポリシーは、本サービスにおけるデータの取り扱いについて定めるものです。</p>

        <h2>第1条（収集するデータ）</h2>
        <p>本サービスは、以下のデータを収集します。</p>
        <ol>
          <li><strong>IPアドレス</strong>: 投稿時にサーバーログおよびデータベースに記録されます。スパム対策・不正利用防止・レート制限の目的で使用されます。</li>
          <li><strong>端末識別子（device_id）</strong>: ブラウザのCookieに保存されるランダムなID（UUID）です。連投制限・デバイスBAN・通報機能の運用に使用されます。個人を特定する情報は含まれません。</li>
          <li><strong>投稿内容</strong>: ユーザーが入力した講義名、教員名、評価、コメント等の情報です。</li>
        </ol>

        <h2>第2条（収集しないデータ）</h2>
        <p>本サービスは、以下のデータを<strong>一切収集しません</strong>。</p>
        <ol>
          <li><strong>GPS情報・位置情報</strong>: 本サービスはブラウザの位置情報API（Geolocation API）を使用しておらず、GPS情報や位置情報を取得・記録する機能は実装されていません。</li>
          <li><strong>氏名・住所・電話番号等の個人情報</strong>: 本サービスは会員登録を必要としておらず、これらの情報の入力欄は存在しません。</li>
          <li><strong>閲覧履歴・行動追跡データ</strong>: 本サービスはGoogle Analytics等の第三者トラッキングツールを使用していません。</li>
        </ol>

        <h2>第3条（Cookieの使用）</h2>
        <ol>
          <li>本サービスは、以下の目的でCookieを使用します。
            <ul>
              <li><strong>端末識別子（device_id）</strong>: 連投制限・BAN管理に使用するランダムなUUID</li>
              <li><strong>セッション情報</strong>: CSRF保護トークン、管理者ログイン状態の管理</li>
              <li><strong>テーマ設定</strong>: ダークモードの選択状態（localStorageに保存）</li>
            </ul>
          </li>
          <li>本サービスは、広告目的のCookieや第三者のトラッキングCookieを使用しません。</li>
        </ol>

        <h2>第4条（データの利用目的）</h2>
        <p>収集したデータは、以下の目的にのみ使用します。</p>
        <ol>
          <li>本サービスの提供・運営・改善</li>
          <li>スパム・荒らし行為の防止</li>
          <li>利用規約に違反する行為への対処</li>
          <li>通報・連絡機能の運用および対応</li>
        </ol>

        <h2>第5条（第三者への提供）</h2>
        <ol>
          <li>運営者は、以下の場合を除き、収集したデータを第三者に提供しません。
            <ul>
              <li>法令に基づく開示請求があった場合</li>
              <li>ユーザーまたは第三者の権利・財産・安全を保護するために必要な場合</li>
              <li>裁判所の命令その他法的手続きにより開示が求められた場合</li>
            </ul>
          </li>
        </ol>

        <h2>第6条（データの保管と削除）</h2>
        <ol>
          <li>投稿データは、運営者が削除するか本サービスを終了するまでデータベースに保管されます。</li>
          <li>IPアドレスは投稿データと共に保管され、管理者のみがアクセスできます。</li>
          <li>レート制限用のIPアドレス記録は、サーバーのメモリ上に一時的に保持され、サーバー再起動時に自動的に消去されます。</li>
        </ol>

        <h2>第7条（ポリシーの変更）</h2>
        <p>運営者は、必要に応じて本ポリシーを変更できるものとします。変更後のポリシーは、本サービス上に表示した時点で効力を生じます。</p>

        <h2>第8条（お問い合わせ）</h2>
        <p>本ポリシーに関するお問い合わせは、以下までご連絡ください。</p>
        <p>メールアドレス: <a href="mailto:contact@neokibutsu.net">contact@neokibutsu.net</a></p>

        <hr className="border-0 border-t border-border my-6" />
        <p className="text-center">
          <Link href="/terms" className="text-dark-gray">利用規約</Link>
          <span className="mx-2.5 text-dark-gray">|</span>
          <Link href="/guidelines" className="text-dark-gray">ガイドライン</Link>
          <span className="mx-2.5 text-dark-gray">|</span>
          <Link href="/" className="text-dark-gray">トップページに戻る</Link>
        </p>
      </div>
    </main>
  )
}
