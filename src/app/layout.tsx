import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import fs from "fs";
import path from "path";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import Header from "@/components/Header";

function getNewsLines(): string[] {
  try {
    const filePath = path.join(process.cwd(), "public", "news.txt");
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  metadataBase: new URL("https://www.neokibutsu.net"),
  alternates: {
    canonical: "/",
  },
  title: "北海道大学 NEO鬼仏表",
  description:
    "NEO鬼仏表は北大の講義評価サイトです。鬼〜仏で評価された講義一覧のほか、テストやレポート・出席の有無など履修選びに役立つ情報を検索・投稿できます。",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192-universal.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icon-180-universal.png",
  },
  openGraph: {
    title: "NEO鬼仏表 - 北海道大学の新しい鬼仏表",
    type: "website",
    url: "https://www.neokibutsu.net",
    images: ["/icon-192-universal.png"],
    description: "NEO鬼仏表は北大の講義評価サイトです。鬼〜仏で評価された講義一覧のほか、テストやレポート・出席の有無など履修選びに役立つ情報を検索・投稿できます。",
    siteName: "NEO鬼仏表",
  },
  twitter: { card: "summary" },
  verification: {
    google: "K-tSoPukdExrQ7NmCWPte8mIE7LB-ULjSsD1_LmEGgk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const newsLines = getNewsLines();

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Shippori+Antique+B1&display=swap&text=%E5%8C%97%E6%B5%B7%E9%81%93%E5%A4%A7%E5%AD%A6NEO%E9%AC%BC%E4%BB%8F%E8%A1%A8"
        />
        {/* Prevent FOUC for dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark-mode')`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Header newsLines={newsLines} />
            {children}
          </ToastProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
