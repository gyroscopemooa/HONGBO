import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ListView } from "@/components/ListView";
import { CATEGORY_MAP, isCategorySlug } from "@/lib/constants";
import { buildHref, parseListParams, type SearchParams } from "@/lib/listing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isCategorySlug(slug)) return {};
  const c = CATEGORY_MAP[slug];
  const p = parseListParams(await searchParams);
  return {
    title: `${c.name} 홍보`,
    description: `${c.desc} 더홍보에서 ${c.name} 홍보글을 무료로 올리고 둘러보세요.`,
    alternates: {
      canonical: buildHref(`/category/${slug}`, { sort: p.sort === "popular" ? "popular" : undefined, region: p.region, page: p.page > 1 ? p.page : undefined }),
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (!isCategorySlug(slug)) notFound();
  const c = CATEGORY_MAP[slug];
  const p = parseListParams(await searchParams);
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
          {c.name}
        </span>
      }
      description={c.desc}
    />
  );
}
