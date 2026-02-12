import type { Metadata, Viewport } from "next";
import "./globals.css";

// 💡 삼성인터넷 강제 반전을 막고 크롬 화면을 정상화하는 핵심 코드!
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: "DotDecoder",
  description: "BIP-39 Binary Decoder",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 폰트 다운로드 부분을 삭제하고 기본 sans-serif 폰트를 사용하도록 변경 */}
      <body className="font-sans antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}