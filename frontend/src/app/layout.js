import { Outfit, Noto_Sans_KR, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./hooks/useTheme";
import AppLayoutShell from "./components/layout/AppLayoutShell";

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
  title: "개미의 우산 | 캐릭터 날씨로 쉽게 확인하는 내 주식 리스크 진단",
  description: "개미미 캐릭터가 알려주는 오늘 내 주식의 날씨! 복잡한 ESG 악재와 거시 지표를 날씨 기호(맑음·비·번개)로 쉽고 직관적으로 판단하여 주가 급락 위험을 지켜줍니다.",
  openGraph: {
    title: "개미의 우산 | 캐릭터 날씨로 쉽게 확인하는 내 주식 리스크 진단",
    description: "내 주식의 오늘 날씨는 어떨까? 개미미와 함께 복잡한 리스크를 날씨로 쉽고 직관적으로 진단해 보세요.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "개미의 우산 로고",
      },
    ],
  },
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
        <script id="theme-initializer" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <ThemeProvider>
          <AppLayoutShell>
            {children}
          </AppLayoutShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
