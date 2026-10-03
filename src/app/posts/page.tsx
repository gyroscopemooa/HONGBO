import type { Metadata } from "next";
import { ListView } from "@/components/ListView";
import { buildHref, parseListParams, type SearchParams } from "@/lib/listing";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = parseListParams(await searchParams);
  const title = p.sort === "popular" ? "인기 홍보글" : "전체 홍보글";
  return {
    title,
    description: "앱, 웹사이트, 서비스, 가게, 상품, 콘텐츠까지 — 더홍보에 올라온 모든 홍보글을 한곳에서 둘러보세요.",
    alternates: {
      canonical: buildHref("/posts", { sort: p.sort === "popular" ? "popular" : undefined, region: p.region, page: p.page > 1 ? p.page : undefined }),
    },
  };
}

export default async function PostsPage({ searchParams }: Props) {
  const params = parseListParams(await searchParams);
  const heading = params.sort === "popular" ? "인기 홍보글" : "전체 홍보글";
  return (
    <ListView
      basePath="/posts"
      params={params}
      heading={heading}
      description="앱·사이트·가게·상품·서비스… 모든 홍보를 한곳에서 둘러보세요."
    />
  );
}
