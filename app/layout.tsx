import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans",
});

// Noto Serif JP
const notoSerif = Noto_Serif_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto-serif",
});

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
    <html lang="ja" suppressHydrationWarning>
      {/* 🌟 bodyのクラスに両方のフォントクラスを流し込みます */}
      <body className={`${notoSans.variable} ${notoSerif.variable} antialiased font-sans`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}