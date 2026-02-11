import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL("https://goodcycle-habit-app.vercel.app"),
  title: "GoodCycle - 成長が見える習慣トラッカー",
  description:
    "頑張りたいのに続かない人のための習慣アプリ。記録・3D可視化・振り返りで、努力が続く実感に変わります。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "GoodCycle - 成長が見える習慣トラッカー",
    description:
      "頑張りたいのに続かない人のための習慣アプリ。記録・3D可視化・振り返りで、努力が続く実感に変わります。",
    images: ["/icons/ogp.png"],
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className="bg-white dark:bg-gray-900"
    >
      <body
        className={`${inter.className} min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors`}
      >
        <ThemeProvider>
          <main className="min-h-screen bg-white dark:bg-gray-900">
            {children}
          </main>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
