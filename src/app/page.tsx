import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Flame, Siren } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { BannerPlaceholder, BannerSlider } from "@/components/BannerSlider";
import { Carousel } from "@/components/Carousel";
import { ExclusiveStrip } from "@/components/ExclusiveStrip";
import { CategoryTiles } from "@/components/CategoryTiles";
import { FeatureRequestBanner } from "@/components/FeatureRequestBanner";
import { Infl09Banner } from "@/components/Infl09Banner";
import { Hero } from "@/components/Hero";
import { HOME_FAQ, HomeFaq } from "@/components/HomeFaq";
import { NoticeList } from "@/components/NoticeList";
import { PostCard } from "@/components/PostCard";
import { PostRow } from "@/components/PostRow";
import { PremiumGrid } from "@/components/PremiumGrid";
import { PromoBanner } from "@/components/PromoBanner";
import { RankList } from "@/components/RankList";
import { AD_BANNER_SLOTS, AD_PREMIUM_SLOTS, AD_PRICES, won } from "@/lib/ads";
import { infl09ApplyUrl } from "@/lib/infl09";
import { SITE } from "@/lib/constants";
import { getHomeData } from "@/lib/queries";
import { siteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: SITE.seoTitle },
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { popular, latest, sideBanners, stripBanners, notices, premium, adBanners } = await getHomeData();

  // 추천 영역(앞 3자리)에 나온 글은 배너에서 제외하고, 배너 자리가 남으면 최신 글로 채웁니다.
  const premiumAds = premium.slice(0, AD_PREMIUM_SLOTS);
  // 최신 글로 비는 자리를 채울 때는 "다시 홍보하기(끌어올리기)"로 위로 올라온 글은 제외하고, 새로 등록한 글만 씁니다.
  const fresh = latest.filter((p) => Math.abs(new Date(p.bumpedAt).getTime() - new Date(p.publishedAt).getTime()) < 60_000);
  const premiumFill = fresh.filter((p) => !premiumAds.some((a) => a.id === p.id)).slice(0, AD_PREMIUM_SLOTS - premiumAds.length);
  const used = new Set([...premiumAds, ...premiumFill].map((p) => p.id));
  const bannerAds = adBanners.slice(0, AD_BANNER_SLOTS);
  const bannerFill = fresh
    .filter((p) => p.primaryImageUrl && !used.has(p.id) && !bannerAds.some((a) => a.post.id === p.id))
    .slice(0, AD_BANNER_SLOTS - bannerAds.length);
  const hasBannerRoom = bannerAds.length < AD_BANNER_SLOTS;
  const bannerCount = bannerAds.length + bannerFill.length + (hasBannerRoom ? 1 : 0);

  const infl09Url = infl09ApplyUrl();
  const base = siteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: SITE.name,
      alternateName: ["thehongbo", "더홍보 무료 홍보 사이트", "무료홍보사이트 더홍보"],
      url: base,
      description: SITE.description,
      inLanguage: "ko-KR",
      publisher: { "@id": `${base}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${base}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: SITE.name,
      url: base,
      logo: `${base}/og.png`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOME_FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <h1 className="sr-only">{SITE.name} - 앱·사이트·가게·상품을 마음껏 무료로 홍보하는 홍보 사이트</h1>
      <section aria-label="배너" className="wrap pt-5 sm:pt-7">
        <BannerSlider count={bannerCount} label="추천 배너">
          {bannerAds.map(({ post, creative }) => (
            <li key={`ad-${post.id}`} className="w-full shrink-0 snap-center">
              <AdBanner post={post} creative={creative} />
            </li>
          ))}
          {bannerFill.map((p) => (
            <li key={`new-${p.id}`} className="w-full shrink-0 snap-center">
              <AdBanner post={p} ad={false} />
            </li>
          ))}
          {hasBannerRoom && (
            <li className="w-full shrink-0 snap-center">
              <BannerPlaceholder priceText={`주 ${won(AD_PRICES.banner.week)} · 월 ${won(AD_PRICES.banner.month)}`} />
            </li>
          )}
        </BannerSlider>
      </section>

      <PremiumGrid ads={premiumAds} fill={fresh} />

      <div className="mt-8 sm:mt-10">
        <Hero infl09={{ url: infl09Url, preview: !infl09Url && process.env.NODE_ENV !== "production" }} />
      </div>
      <CategoryTiles />

      <Suspense fallback={null}>
        <ExclusiveStrip wrap />
      </Suspense>

      <Carousel title="오늘의 인기 홍보" icon={<Flame className="text-brand" size={22} fill="currentColor" aria-hidden />} moreHref="/posts?sort=popular">
        {popular.slice(0, 12).map((p, i) => (
          <li key={p.id}>
            <PostCard post={p} eager={i < 6} rank={i + 1} />
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

      <section aria-label="전체 홍보글" className="wrap pt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-[-0.04em]">
            <Siren size={22} className="text-brand" aria-hidden /> 전체 홍보글
          </h2>
          <div className="flex items-center gap-2 text-[13.5px] font-semibold">
            <Link href="/posts?sort=latest" className="rounded-full bg-ink px-3.5 py-1.5 text-white">
              최신순
            </Link>
            <Link href="/posts?sort=popular" className="rounded-full border border-line bg-white px-3.5 py-1.5 text-ink-2 hover:text-brand">
              인기순
            </Link>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {latest.map((p, i) => (
            <li key={p.id}>
              <PostCard post={p} eager={i < 5} />
            </li>
          ))}
        </ul>
        <Link href="/posts?sort=latest" className="btn btn-outline mt-4 w-full">
          전체 홍보글 더보기 <ChevronRight size={15} aria-hidden />
        </Link>
      </section>

      <div className="wrap grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-5 pt-6 lg:grid-cols-[minmax(0,1fr)_270px_290px]">
        <section aria-label="최신 홍보글" className="min-w-0 rounded-2xl border border-line bg-white p-3 shadow-card sm:p-4">
          <div className="mb-1.5 flex items-center justify-between px-1.5 pt-1">
            <h2 className="flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.04em]">
              <Siren size={20} className="text-brand" aria-hidden /> 최신 홍보글
            </h2>
            <Link href="/posts?sort=latest" className="inline-flex items-center text-[13.5px] font-medium text-muted hover:text-brand">
              더보기 <ChevronRight size={15} aria-hidden />
            </Link>
          </div>
          <div className="divide-y divide-line/60">
            {latest.slice(0, 11).map((p) => (
              <PostRow key={p.id} post={p} />
            ))}
          </div>
        </section>

        <RankList posts={popular} limit={20} />

        <aside aria-label="사이드" className="min-w-0 space-y-4">
          {sideBanners[0] && <PromoBanner banner={sideBanners[0]} className="min-h-[132px]" />}
          <NoticeList notices={notices} />
          {sideBanners[1] && <PromoBanner banner={sideBanners[1]} className="min-h-[104px]" />}
          <Infl09Banner />
          <FeatureRequestBanner />
        </aside>
      </div>

      <HomeFaq />
    </>
  );
}
