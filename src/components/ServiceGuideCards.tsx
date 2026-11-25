import Link from "next/link";
import type { ServiceGuide } from "@/data/service-guides";
import { SERVICE_FIELDS } from "@/lib/constants";

export function ServiceGuideCards({ guides, heading = "서비스 이용 가이드" }: { guides: ServiceGuide[]; heading?: string }) {
  if (!guides.length) return null;
  return <section className="my-6 rounded-2xl border border-line bg-white p-4 sm:p-5" aria-label={heading}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-extrabold">{heading}</h2><Link href="/service-guides" className="text-sm font-semibold text-brand">전체 가이드 보기</Link></div>
    <p className="mb-3 text-sm text-muted">더홍보 운영자 안내 콘텐츠입니다. 실제 업체의 예약 상품이나 후기는 아닙니다.</p>
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{guides.map(g => <li key={g.slug}><Link href={`/service-guides/${g.slug}`} className="block h-full rounded-xl border border-line p-3 hover:bg-soft">
      <span className="text-xs font-semibold text-brand">{SERVICE_FIELDS[g.field].name} · 이용 가이드</span><h3 className="mt-1 text-[15px] font-bold">{g.title}</h3><p className="mt-1 text-sm text-muted">{g.description}</p>
    </Link></li>)}</ul>
  </section>;
}
