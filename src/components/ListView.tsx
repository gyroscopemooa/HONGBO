import Link from "next/link";
import { Suspense } from "react";
import { Flame, Clock, Sparkles } from "lucide-react";
import { PAGE_SIZE, SERVICE_FIELDS, SERVICE_PRICE_FILTERS, GENERAL_SERVICE_FIELDS, isIndependentService, isServiceCategory, type CategorySlug } from "@/lib/constants";
import { buildHref, type ListParams } from "@/lib/listing";
import { getPopularMode, getPopularPosts } from "@/lib/queries";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { PostCard } from "./PostCard";
import { RegionSelect } from "./RegionSelect";
import { SERVICE_GUIDES } from "@/data/service-guides";
import { ServiceGuideCards } from "./ServiceGuideCards";

interface Props {
  basePath: string;
  params: ListParams;
  heading: React.ReactNode;
  description?: string;
  category?: CategorySlug;
  /** 혜택 필터 (event/discount/coupon/free/gift 또는 any) */
  benefit?: string;
  /** 제목 아래에 넣을 추가 영역 (탭 등) */
  top?: React.ReactNode;
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
  benefit,
  top,
  onlyWithRegion,
  query,
  keepParams = {},
  showRegionFilter = true,
  emptyTitle,
}: Props) {
  const isService = category === "services";
  const hasPriceFilter = isServiceCategory(category);
  const popularMode = params.sort === "popular" ? await getPopularMode() : undefined;
  const { items, total } = await store.listPosts({
    publicOnly: true,
    category,
    service: isService ? params.service : undefined,
    priceFilter: hasPriceFilter ? params.price : undefined,
    benefit,
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
      service: isService ? params.service : undefined,
      price: hasPriceFilter ? params.price : undefined,
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

      {hasPriceFilter && <section className="mb-5 space-y-3" aria-label="서비스 분야 및 요금 필터">
        {isService && <div className="flex flex-wrap gap-2">
          <Link href={href({ service: undefined, page: undefined })} className={tab(!params.service)}>전체 서비스</Link>
          {GENERAL_SERVICE_FIELDS.map(slug => <Link key={slug} href={href({ service: slug, page: undefined })} className={tab(params.service === slug)}>{SERVICE_FIELDS[slug].name}</Link>)}
          {params.service === "psychology" && <Link href={href({ service: "psychology", page: undefined })} className={tab(true)}>기존 심리·상담</Link>}
        </div>}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">기준 요금</span>
          <Link href={href({ price: undefined, page: undefined })} className={tab(!params.price)}>전체</Link>
          {Object.entries(SERVICE_PRICE_FILTERS).map(([slug, label]) => <Link key={slug} href={href({ price: slug, page: undefined })} className={tab(params.price === slug)}>{label}</Link>)}
        </div>
      </section>}
      {top}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href({ sort: undefined, page: undefined })} className={tab(params.sort === "latest")}>
            <Clock size={15} aria-hidden /> 최신순
          </Link>
          <Link href={href({ sort: "published", page: undefined })} className={tab(params.sort === "published")}>
            <Sparkles size={15} aria-hidden /> 신규 등록순
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

      {hasPriceFilter && params.page === 1 && <ServiceGuideCards guides={isIndependentService(category) ? SERVICE_GUIDES.filter(g => g.field === category) : params.service === "psychology" ? SERVICE_GUIDES.filter(g => g.field === "psych-test" || g.field === "counseling") : params.service ? SERVICE_GUIDES.filter(g => g.field === params.service) : SERVICE_GUIDES.filter(g => GENERAL_SERVICE_FIELDS.includes(g.field))} heading={isIndependentService(category) ? `${SERVICE_FIELDS[category].name} 이용 가이드` : params.service ? `${SERVICE_FIELDS[params.service].name} 이용 가이드` : "전문 서비스 이용 가이드"} />}
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
