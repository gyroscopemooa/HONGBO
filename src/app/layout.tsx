import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { CategoryNav } from "@/components/CategoryNav";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE } from "@/lib/constants";
import { siteUrl } from "@/lib/utils";

// 홍보글·배너·공지·로그인 상태가 모든 화면에 실시간으로 반영되어야 하므로 전체를 요청 시점에 렌더링합니다.
export const dynamic = "force-dynamic";

const title = SITE.seoTitle;

// 서치콘솔 / 네이버 서치어드바이저 소유확인 값 (발급받은 content 값만 환경변수로 넣으면 됩니다)
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
const naverVerification = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: SITE.keywords,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": [{ url: "/rss.xml", title: `${SITE.name} 최신 홍보글` }] },
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: {
    google: googleVerification || undefined,
    other: naverVerification ? { "naver-site-verification": naverVerification } : undefined,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE.name,
    title,
    description: SITE.description,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description: SITE.description, images: ["/og.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-pop"
        >
          본문 바로가기
        </a>
        <Header />
        <CategoryNav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
