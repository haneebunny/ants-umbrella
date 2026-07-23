import { Outfit, Noto_Sans_KR, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* ─── Google Fonts ─── */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "개미의 우산 - 투자성향진단 시스템",
  description: "개미의 우산의 정교한 알고리즘을 통해 당신만의 독특한 투자 성향을 분석합니다.",
};

// 페이지 렌더 전에 localStorage에서 테마를 읽어 <html>에 즉시 적용
// → 화면 전환 시 flicker(흰 화면 깜빡임) 방지
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('ants_theme');
    var html = document.documentElement;
    if (t === 'dark') {
      html.classList.remove('light');
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${outfit.variable} ${notoSansKr.variable} ${jetbrainsMono.variable} h-full antialiased light`}
    >
      {/* dangerouslySetInnerHTML 사용: 인라인 스크립트로 첫 렌더 전 테마 주입 */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
