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

const title = `${SITE.name} — ${SITE.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["무료 홍보", "홍보 게시판", "앱 홍보", "가게 홍보", "상품 홍보", "서비스 홍보", "더홍보"],
  alternates: { canonical: "/" },
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
