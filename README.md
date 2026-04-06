# neo鬼仏表

北海道大学の講義評価共有サイト。学生同士で講義の感想や評価を匿名で投稿・閲覧できます。

https://www.neokibutsu.net

| ライトモード | ダークモード |
|:---:|:---:|
| ![Light](docs/screenshot-light.png) | ![Dark](docs/screenshot-dark.png) |

## 主な機能

- **講義評価の投稿・閲覧** — 鬼〜仏の5段階評価、テスト・レポート・出席の有無など
- **検索・フィルター** — 講義名・教員名での検索、科目区分（全学教育科目 / 専門科目）フィルター
- **ブックマーク** — 北大Googleアカウントでログインして講義を保存
- **いいね** — 参考になった評価にリアクション
- **通報・通知** — 不適切な投稿の通報、管理者からの通知受信
- **管理者ダッシュボード** — 投稿管理、通報対応、デバイスBAN、CSV出力
- **ダークモード / PWA対応**

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router, React 19, TypeScript) |
| データベース | Supabase (PostgreSQL) |
| 認証 | Google OAuth (北大アカウント) |
| スタイリング | Tailwind CSS 4 |
| テスト | Vitest, Testing Library |
| ホスティング | Vercel |
| 通知連携 | Telegram Bot (管理者通知) |

## セットアップ

```bash
git clone https://github.com/6irdsong/neokibutsu.git
cd neokibutsu
npm install
```

### 環境変数

`.env.example` をコピーして設定:

```bash
cp .env.example .env.local
```

| 変数名 | 説明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー |
| `SECRET_KEY` | セッション署名用シークレット |
| `ADMIN_PASSWORD` | 管理者パスワード |
| `DEVICE_ID_SECRET` | デバイスID生成用シークレット |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth クライアントID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット |
| `ADMIN_EMAILS` | 管理者メールアドレス |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot トークン (任意) |
| `TELEGRAM_CHAT_ID` | Telegram チャットID (任意) |

### データベース

Supabase SQL Editor で `supabase-schema.sql` を実行してテーブルを作成。

### 開発サーバー

```bash
npm run dev    # http://localhost:3000
```

### その他のコマンド

```bash
npm run build       # プロダクションビルド
npm run lint        # ESLint
npm run test        # テスト実行
npm run test:watch  # テスト (watch mode)
```

## プロジェクト構成

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── admin/          #   管理者API
│   │   ├── auth/           #   Google OAuth
│   │   ├── bookmark/       #   ブックマーク
│   │   ├── post/           #   投稿CRUD
│   │   ├── report/         #   通報
│   │   ├── search/         #   検索
│   │   └── ...
│   ├── admin/              # 管理者ページ
│   ├── post/               # 投稿詳細ページ
│   ├── guidelines/         # ガイドライン
│   ├── privacy/            # プライバシーポリシー
│   ├── terms/              # 利用規約
│   └── page.tsx            # トップページ
├── components/             # React コンポーネント
├── lib/                    # ユーティリティ・型定義
└── proxy.ts                # リクエストプロキシ
```

## ライセンス

[AGPL-3.0](LICENSE)
