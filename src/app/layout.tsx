import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "整形外科しどーい君 v1",
  description: "整形外科手術の学習資料自動生成・クイズアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-900 text-slate-100">
        <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-blue-400 hover:text-blue-300 transition-colors">
              <span className="text-2xl">🦴</span>
              <span>整形外科しどーい君 v1</span>
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="text-slate-300 hover:text-white transition-colors">
                ホーム
              </Link>
              <Link href="/progress" className="text-slate-300 hover:text-white transition-colors">
                学習進捗
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
