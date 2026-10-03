import Link from "next/link";
import { Suspense } from "react";
import { Flame, Clock } from "lucide-react";
import { PAGE_SIZE, type CategorySlug } from "@/lib/constants";
import { buildHref, type ListParams } from "@/lib/listing";
import { getPopularMode, getPopularPosts } from "@/lib/queries";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { PostCard } from "./PostCard";
import { RegionSelect } from "./RegionSelect";

interface Props {
  basePath: string;
  params: ListParams;
  heading: React.ReactNode;
  description?: string;
  category?: CategorySlug;
  /** 지역 정보가 있는 글만 보여주기 (지역별 페이지) */
  onlyWithRegion?: boolean;
  /** 검색어 (검색 페이지) */
  query?: string;
  /** URL 에 항상 유지할 파라미터 */
  keepParams?: Record<string, string | undefined>;
  showRegionFilter?: boolean;
  emptyTitle?: string;
}

export async function ListView({
  basePath,
  params,
  heading,
  description,
  category,
  onlyWithRegion,
  query,
  keepParams = {},
  showRegionFilter = true,
  emptyTitle,
}: Props) {
  const popularMode = params.sort === "popular" ? await getPopularMode() : undefined;
  const { items, total } = await store.listPosts({
    publicOnly: true,
    category,
    q: query,
    region: params.region,
    hasRegion: onlyWithRegion,
    sort: params.sort,
    popularMode,
    page: params.page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (patch: Record<string, string | number | undefined>) =>
    buildHref(basePath, {
      ...keepParams,
      sort: params.sort === "latest" ? undefined : params.sort,
      region: params.region,
      ...patch,
    });

  const tab = (active: boolean) =>
    cn(
      "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition",
      active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2 hover:border-[#c9ced9]",
    );

  // 결과가 없을 때 사이트가 끊겨 보이지 않도록 인기 홍보를 대신 보여줍니다.
  const fallback = total === 0 ? (await getPopularPosts(5)).filter((p) => !category || p.category !== category).slice(0, 5) : [];

  return (
    <div className="wrap py-6 sm:py-8">
      <div className="mb-5 flex flex-col gap-1">
        <h1 className="text-[24px] font-black tracking-[-0.045em] sm:text-[28px]">{heading}</h1>
        {description && <p className="text-[14.5px] text-muted">{description}</p>}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={href({ sort: undefined, page: undefined })} className={tab(params.sort === "latest")}>
            <Clock size={15} aria-hidden /> 최신순
          </Link>
          <Link href={href({ sort: "popular", page: undefined })} className={tab(params.sort === "popular")}>
            <Flame size={15} aria-hidden /> 인기순
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            총 <b className="font-bold text-ink">{total.toLocaleString()}</b>개
          </span>
          {showRegionFilter && (
            <Suspense fallback={null}>
              <RegionSelect value={params.region} />
            </Suspense>
          )}
        </div>
      </div>

      {total === 0 ? (
        <>
          <EmptyState
            title={emptyTitle ?? (query ? `'${query}'에 대한 홍보글이 없어요` : "아직 등록된 홍보글이 없어요")}
            description={query ? "다른 검색어를 입력하거나, 직접 홍보글을 올려보세요." : "첫 번째 홍보글의 주인공이 되어보세요."}
          />
          {fallback.length > 0 && (
            <section className="mt-10" aria-label="다른 인기 홍보">
              <h2 className="mb-3 text-lg font-extrabold tracking-[-0.03em]">이런 홍보는 어때요?</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {fallback.map((p) => (
                  <li key={p.id}>
                    <PostCard post={p} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((p, i) => (
              <li key={p.id}>
                <PostCard post={p} eager={i < 5} />
              </li>
            ))}
          </ul>
          <Pagination page={params.page} totalPages={totalPages} hrefFor={(n) => href({ page: n > 1 ? n : undefined })} />
        </>
      )}
    </div>
  );
}
