import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata = {
  title: "개미의 우산 - 투자성향진단 시스템",
  description: "개미의 우산의 정교한 알고리즘을 통해 당신만의 독특한 투자 성향을 분석합니다.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col transition-colors duration-300 dark:bg-[#0d0f0f] bg-[#f4f9f7] dark:text-[#e2e2e2] text-[#0f1713]">
        {children}
      </body>
    </html>
  );
}

