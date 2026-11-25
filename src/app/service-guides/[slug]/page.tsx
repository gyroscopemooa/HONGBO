import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICE_GUIDES } from "@/data/service-guides";
import { SERVICE_FIELDS, serviceFieldHref } from "@/lib/constants";
import { ServiceGuideCards } from "@/components/ServiceGuideCards";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return SERVICE_GUIDES.map(g => ({ slug: g.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = SERVICE_GUIDES.find(x => x.slug === slug);
  if (!g) return { robots: { index: false, follow: false } };
  return { title: g.title, description: g.description, alternates: { canonical: `/service-guides/${g.slug}` }, openGraph: { type: "article", title: g.title, description: g.description, url: `/service-guides/${g.slug}` } };
}
export default async function ServiceGuidePage({ params }: Props) {
  const { slug } = await params;
  const g = SERVICE_GUIDES.find(x => x.slug === slug);
  if (!g) notFound();
  const listing = serviceFieldHref(g.field);
  return <main className="wrap py-8"><div className="mx-auto max-w-3xl"><nav aria-label="현재 위치" className="mb-4 flex flex-wrap gap-2 text-sm text-muted"><Link href="/service-guides">서비스 이용 가이드</Link><span aria-hidden>/</span><Link href={listing}>{SERVICE_FIELDS[g.field].name}</Link></nav><article className="rounded-2xl border border-line bg-white p-5 sm:p-8"><p className="text-sm font-semibold text-brand">더홍보 운영자 이용 가이드</p><h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{g.title}</h1><p className="mt-3 text-base text-muted">{g.description}</p>{g.sections.map(s => <section key={s.heading} className="mt-7"><h2 className="text-lg font-extrabold">{s.heading}</h2><p className="mt-2 whitespace-pre-line leading-7 text-ink-2">{s.body}</p></section>)}<p className="mt-6 text-sm text-muted">이 글은 비교·문의 방법을 소개하는 안내 콘텐츠이며, 실제 업체의 상품·가격·예약 가능 여부를 보증하지 않습니다.</p><div className="mt-5 flex flex-wrap gap-2"><Link href={listing} className="btn btn-primary">{SERVICE_FIELDS[g.field].name} 홍보글 보기</Link><Link href="/write" className="btn btn-outline">내 서비스 무료 홍보</Link></div></article><ServiceGuideCards guides={SERVICE_GUIDES.filter(x => x.field === g.field && x.slug !== g.slug)} heading="관련 이용 가이드" /><Link href="/service-guides" className="mt-5 inline-block text-sm font-semibold text-brand">전체 가이드 보기</Link></div></main>;
}
