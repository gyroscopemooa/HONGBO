import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CategoryIcon } from "@/components/CategoryIcon";
import { TopAds } from "@/components/TopAds";
import { ListView } from "@/components/ListView";
import { CATEGORY_MAP, isCategorySlug, legacyServiceField, SERVICE_FIELDS, isIndependentService, isServiceCategory } from "@/lib/constants";
import { buildHref, parseListParams, type SearchParams } from "@/lib/listing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isCategorySlug(slug)) return {};
  const c = CATEGORY_MAP[slug];
  const p = parseListParams(await searchParams);
  const field = isIndependentService(slug) ? SERVICE_FIELDS[slug] : slug === "services" && p.service ? SERVICE_FIELDS[p.service] : null;
  const name = field?.name ?? c.name;
  return {
    title: `${name} 무료 홍보 - ${name} 서비스 찾기`,
    description: field ? `${name} 서비스 제공자와 이용 가이드를 더홍보에서 찾아보세요. ${field.kind.replace("예) ", "")} 등 분야별 서비스 홍보 및 문의 방법을 확인할 수 있습니다.` : `${c.desc} 무료 홍보 사이트 더홍보에서 ${c.name} 홍보글을 마음껏 올리고 둘러보세요.`,
    alternates: {
      canonical: buildHref(`/category/${slug}`, { sort: p.sort === "popular" ? "popular" : undefined, region: p.region, service: slug === "services" ? p.service : undefined, price: isServiceCategory(slug) ? p.price : undefined, page: p.page > 1 ? p.page : undefined }),
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const legacy = legacyServiceField(slug);
  if (legacy) redirect(buildHref("/category/services", { ...(parseListParams(await searchParams)), page: undefined, sort: undefined, service: legacy, price: undefined }));
  if (!isCategorySlug(slug)) notFound();
  const c = CATEGORY_MAP[slug];
  const p = parseListParams(await searchParams);
  if (slug === "services" && isIndependentService(p.service)) redirect(buildHref(`/category/${p.service}`, { region: p.region, sort: p.sort === "popular" ? p.sort : undefined, price: p.price, page: p.page > 1 ? p.page : undefined }));
  return (
    <ListView
      basePath={`/category/${slug}`}
      params={p}
      category={slug}
      heading={
        <span className="inline-flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: c.tint, color: c.color }}>
            <CategoryIcon slug={slug} size={22} />
          </span>
          {slug === "services" && p.service ? SERVICE_FIELDS[p.service].name : c.name}
        </span>
      }
      description={isIndependentService(slug) ? c.desc : slug === "services" && p.service ? `${SERVICE_FIELDS[p.service].name} 서비스 홍보와 이용 가이드` : c.desc}
      top={p.page === 1 && p.sort === "latest" ? <TopAds category={slug} /> : undefined}
    />
  );
}
