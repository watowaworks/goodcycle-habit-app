import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "グッドサイクル♾️",
  description: "習慣を可視化して継続を支援するトラッカーアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="bg-gray-50 text-gray-900">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
