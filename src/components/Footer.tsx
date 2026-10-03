import Link from "next/link";
import { SITE } from "@/lib/constants";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="wrap py-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo size="md" />
            <p className="mt-2 text-sm text-muted">{SITE.slogan}</p>
          </div>
          <nav aria-label="푸터 메뉴" className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm text-ink-2">
            {[
              ["/terms", "이용약관"],
              ["/privacy", "개인정보처리방침"],
              ["/policy", "운영정책"],
              ["/contact", "문의하기"],
              ["/contact#ads", "광고문의"],
            ].map(([href, label], i) => (
              <span key={href} className="flex items-center">
                {i > 0 && <span className="mx-2 h-3 w-px bg-line" aria-hidden />}
                <Link href={href} className="font-medium hover:text-brand">
                  {label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
        <div className="mt-7 flex flex-col gap-2 border-t border-line pt-5 text-[13px] leading-relaxed text-faint md:flex-row md:justify-between">
          <p>더홍보는 홍보 공간을 제공하는 플랫폼이며, 외부 링크에서 이루어지는 거래·계약의 당사자가 아닙니다.</p>
          <p className="shrink-0">© {year} 더홍보. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
