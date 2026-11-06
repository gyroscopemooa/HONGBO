import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon, PenLine, Play } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { StarRating } from "@/components/StarRating";
import { listReviews } from "@/lib/review-store";
import { isReviewCategory, REVIEW_CATEGORIES, REVIEW_CATEGORY_LABEL } from "@/lib/reviews";
import { cleanQuery, cn, parsePositiveInt, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const raw = (await searchParams).category;
  const cat = typeof raw === "string" && isReviewCategory(raw) ? REVIEW_CATEGORY_LABEL[raw] : null;
  return {
    title: cat ? `${cat} 후기·리뷰` : "후기·리뷰",
    description: "업체와 서비스를 직접 이용해 본 사람들의 솔직한 후기를 별점과 함께 확인하고 남겨보세요.",
    alternates: { canonical: "/reviews" },
  };
}

export default async function ReviewsPage({ searchParams }: { searchParams: SP }) {
  const params = await searchParams;
  const query = cleanQuery(params.q);
  const catRaw = typeof params.category === "string" ? params.category : "";
  const category = isReviewCategory(catRaw) ? catRaw : "";
  const page = Math.min(parsePositiveInt(params.page), 10000);
  const { items, total } = await listReviews({ page, pageSize: PAGE_SIZE, query, category });

  const hrefFor = (p: number, cat = category) => {
    const q = new URLSearchParams({ ...(query ? { q: query } : {}), ...(cat ? { category: cat } : {}), page: String(p) });
    return `/reviews?${q}`;
  };
  const chipHref = (cat: string) => `/reviews?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(cat ? { category: cat } : {}) })}`;
  const chip = (active: boolean) =>
    cn("shrink-0 rounded-full border px-3.5 py-1.5 text-[13.5px] font-bold transition", active ? "border-brand bg-brand text-white" : "border-line bg-white text-muted hover:border-brand-line");

  return (
    <div className="wrap py-8 sm:py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-black tracking-[-0.04em]">후기·리뷰</h1>
          <p className="mt-1 text-[14px] text-muted">업체와 서비스를 직접 이용해 본 솔직한 후기를 별점과 함께 나눠요. 글쓰기는 로그인 후 가능해요.</p>
        </div>
        <Link href="/reviews/write" className="btn btn-primary">
          <PenLine size={16} aria-hidden /> 후기 쓰기
        </Link>
      </div>

      <nav aria-label="후기 종류" className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        <Link href={chipHref("")} className={chip(!category)} aria-current={!category ? "page" : undefined}>전체</Link>
        {REVIEW_CATEGORIES.map((c) => (
          <Link key={c.value} href={chipHref(c.value)} className={chip(category === c.value)} aria-current={category === c.value ? "page" : undefined}>
            {c.label}
          </Link>
        ))}
      </nav>

      <form action="/reviews" className="mb-4 flex gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <input aria-label="후기 검색" type="search" name="q" defaultValue={query} maxLength={60} placeholder="업체 이름, 제목, 내용으로 검색" className="field min-w-0 flex-1" />
        <button className="btn btn-outline shrink-0">검색</button>
      </form>

      <p className="mb-2 text-sm text-muted">총 {total.toLocaleString()}개의 후기</p>
      {items.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/reviews/${p.id}`} className="flex gap-3 px-4 py-3.5 transition hover:bg-soft sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
                    <span className="rounded-md bg-soft px-1.5 py-0.5 font-bold">{REVIEW_CATEGORY_LABEL[p.category] ?? "기타·자유"}</span>
                    <span className="font-semibold text-ink-2">{p.targetName}</span>
                    <StarRating value={p.rating} size={14} />
                  </p>
                  <p className="mt-1 truncate text-[15.5px] font-bold text-ink">{p.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[13.5px] text-muted">{p.body}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-xs text-faint">
                    {p.nickname} · {relativeTime(p.createdAt)}
                    {p.images.length > 0 && <span className="inline-flex items-center gap-0.5"><ImageIcon size={12} aria-hidden /> {p.images.length}</span>}
                    {p.youtubeId && <span className="inline-flex items-center gap-0.5"><Play size={12} aria-hidden /> 영상</span>}
                  </p>
                </div>
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" loading="lazy" className="size-[72px] shrink-0 rounded-lg border border-line object-cover sm:size-[84px]" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <h2 className="text-lg font-bold">{query || category ? "조건에 맞는 후기가 없어요." : "아직 올라온 후기가 없어요."}</h2>
          <p className="mt-2 text-muted">{query || category ? "다른 종류나 검색어로 찾아보세요." : "첫 후기를 남겨보세요."}</p>
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} hrefFor={(p) => hrefFor(p)} />
    </div>
  );
}
