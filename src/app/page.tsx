import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Flame, Siren } from "lucide-react";
import { Carousel } from "@/components/Carousel";
import { CategoryTiles } from "@/components/CategoryTiles";
import { Hero } from "@/components/Hero";
import { NoticeList } from "@/components/NoticeList";
import { PostCard } from "@/components/PostCard";
import { PostRow } from "@/components/PostRow";
import { PromoBanner } from "@/components/PromoBanner";
import { RankList } from "@/components/RankList";
import { SITE } from "@/lib/constants";
import { getHomeData } from "@/lib/queries";
import { siteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { popular, latest, sideBanners, stripBanners, notices } = await getHomeData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: siteUrl(),
    description: SITE.description,
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl()}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <CategoryTiles />

      <Carousel title="오늘의 인기 홍보" icon={<Flame className="text-brand" size={22} fill="currentColor" aria-hidden />} moreHref="/posts?sort=popular">
        {popular.map((p, i) => (
          <li key={p.id}>
            <PostCard post={p} eager={i < 6} />
          </li>
        ))}
      </Carousel>

      {stripBanners.length > 0 && (
        <section aria-label="추천 배너" className="wrap pb-2 pt-2">
          <ul className="grid gap-3 sm:grid-cols-3">
            {stripBanners.slice(0, 3).map((b) => (
              <li key={b.id}>
                <PromoBanner banner={b} className="h-full" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="wrap grid items-start gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_270px_290px]">
        <section aria-label="최신 홍보글" className="rounded-2xl border border-line bg-white p-3 shadow-card sm:p-4">
          <div className="mb-1.5 flex items-center justify-between px-1.5 pt-1">
            <h2 className="flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.04em]">
              <Siren size={20} className="text-brand" aria-hidden /> 최신 홍보글
            </h2>
            <Link href="/posts?sort=latest" className="inline-flex items-center text-[13.5px] font-medium text-muted hover:text-brand">
              더보기 <ChevronRight size={15} aria-hidden />
            </Link>
          </div>
          <div className="divide-y divide-line/60">
            {latest.map((p) => (
              <PostRow key={p.id} post={p} />
            ))}
          </div>
          <Link href="/posts?sort=latest" className="btn btn-outline mt-3 w-full">
            최신 홍보글 더보기
          </Link>
        </section>

        <RankList posts={popular} />

        <aside aria-label="사이드" className="space-y-4">
          {sideBanners[0] && <PromoBanner banner={sideBanners[0]} className="min-h-[132px]" />}
          <NoticeList notices={notices} />
          {sideBanners[1] && <PromoBanner banner={sideBanners[1]} className="min-h-[104px]" />}
        </aside>
      </div>
    </>
  );
}
