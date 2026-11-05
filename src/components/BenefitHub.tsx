import Link from "next/link";
import { Gift } from "lucide-react";
import { BENEFITS, BENEFIT_PAGES, type BenefitSlug } from "@/lib/constants";
import { buildHref, type ListParams } from "@/lib/listing";
import { siteUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ListView } from "./ListView";

/** 커뮤니티의 이벤트 헌터·블로거 안내 글 */
export const HUNTER_GUIDE_PATH = "/community/221f8933-a41a-4994-a8a6-969083750a2e";

export const BENEFIT_HUB = {
  title: "이벤트 모음 - 세상 모든 이벤트·할인·쿠폰·무료·증정 정보",
  h1: "이벤트 모음",
  desc: "세상 모든 이벤트·할인·쿠폰·무료·증정 혜택이 모여 있는 곳. 진행 중인 이벤트를 한눈에 보고 바로 참여하세요. 이벤트 헌터와 블로거도 환영해요.",
};

const HUB_FAQ = [
  { q: "여기 올라온 이벤트는 누가 올리나요?", a: "앱·가게·쇼핑몰·채널을 운영하는 사장님과 크리에이터가 직접 등록해요. 참여 방법과 기간은 각 글에서 확인하세요." },
  { q: "이벤트나 쿠폰을 올리려면 어떻게 하나요?", a: "무료로 홍보글을 쓰고, 혜택 항목에서 이벤트·할인·쿠폰·무료·증정 중 실제로 제공하는 것을 고르면 이 모음에 자동으로 나타나요." },
  { q: "이벤트 헌터나 블로거도 참여할 수 있나요?", a: "네. 이벤트를 찾아다니는 분, 이벤트 소식을 소개하는 블로거분들도 환영해요. 커뮤니티에서 함께할 이웃을 모집하고 있어요." },
];

/** 혜택(이벤트·할인·쿠폰·무료·증정) 모음 페이지 공통 본문 */
export function BenefitPage({ slug, params }: { slug?: BenefitSlug | "exclusive"; params: ListParams }) {
  const info = slug ? BENEFIT_PAGES[slug] : null;
  const base = siteUrl();
  const basePath = slug ? `/benefit/${slug}` : "/benefit";
  const h1 = info?.h1 ?? BENEFIT_HUB.h1;
  const desc = info?.desc ?? BENEFIT_HUB.desc;

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 items-center rounded-full border px-4 text-sm font-bold transition",
      active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2 hover:border-brand hover:text-brand",
    );

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: info?.title ?? BENEFIT_HUB.title,
      description: desc,
      url: `${base}${basePath}`,
      inLanguage: "ko-KR",
      isPartOf: { "@id": `${base}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: `${base}/` },
        { "@type": "ListItem", position: 2, name: "이벤트 모음", item: `${base}/benefit` },
        ...(info ? [{ "@type": "ListItem", position: 3, name: info.label, item: `${base}${basePath}` }] : []),
      ],
    },
    ...(!slug
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: HUB_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]
      : []),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />
      <ListView
        basePath={basePath}
        params={params}
        benefit={slug ?? "any"}
        showRegionFilter={false}
        emptyTitle={info ? `아직 ${info.label} 혜택이 등록된 글이 없어요` : "아직 등록된 이벤트가 없어요"}
        heading={
          <span className="inline-flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Gift size={22} aria-hidden />
            </span>
            {h1}
          </span>
        }
        description={info?.intro ?? desc}
        top={
          <nav aria-label="혜택 종류" className="mb-4 flex flex-wrap items-center gap-2">
            <Link href="/benefit" className={chip(!slug)}>
              전체
            </Link>
            <Link href="/benefit/exclusive" className={cn(chip(slug === "exclusive"), slug !== "exclusive" && "!border-[#e0a31a] !text-[#8a5a0a]")}>
              더홍보 전용
            </Link>
            {BENEFITS.map((b) => (
              <Link key={b.value} href={buildHref(`/benefit/${b.value}`, {})} className={chip(slug === b.value)}>
                {b.label}
              </Link>
            ))}
            <Link href="/write" className="ml-auto text-[13.5px] font-bold text-brand hover:underline">
              내 이벤트 무료로 올리기 →
            </Link>
          </nav>
        }
      />
      {!slug && (
        <section className="wrap pb-10" aria-label="이벤트 모음 안내">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-[18px] font-extrabold tracking-[-0.03em]">이벤트 모음, 이렇게 활용하세요</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14.5px] leading-relaxed text-ink-2">
              <li>이벤트·할인·쿠폰·무료·증정 중 원하는 혜택만 골라서 볼 수 있어요.</li>
              <li>사장님·크리에이터라면 홍보글에 혜택을 체크해 이벤트를 무료로 알리세요.</li>
              <li>이벤트를 찾아다니는 이벤트 헌터, 소식을 전하는 블로거도 함께해요.</li>
            </ul>
            <Link href={HUNTER_GUIDE_PATH} className="mt-4 inline-flex text-[14px] font-bold text-brand hover:underline">
              이벤트 헌터·블로거 활용 안내 보기 →
            </Link>
            <dl className="mt-5 space-y-3">
              {HUB_FAQ.map((f) => (
                <div key={f.q}>
                  <dt className="text-[14.5px] font-bold text-ink">{f.q}</dt>
                  <dd className="mt-0.5 text-[14px] leading-relaxed text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}
    </>
  );
}
