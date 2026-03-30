import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "優待カレンダー | 株主優待管理アプリ",
  description: "保有株式の株主優待スケジュールを年間タイムラインで一覧管理。AIによる優待情報の自動取得機能搭載。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-stone-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
