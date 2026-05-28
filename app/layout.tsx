import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "わたしの執事",
  description: "あなたに寄り添う、有能で礼儀正しいスケジュール管理執事",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}