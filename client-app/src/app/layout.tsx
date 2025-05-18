import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RunDataProvider } from "./context/RunDataContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Slay the Spire アナライザー",
  description: "Slay the Spireのプレイデータを分析するツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <RunDataProvider>{children}</RunDataProvider>
      </body>
    </html>
  );
}
