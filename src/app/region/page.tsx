import type { Metadata } from "next";
import Link from "next/link";
import { ListView } from "@/components/ListView";
import { REGIONS } from "@/lib/constants";
import { buildHref, parseListParams, type SearchParams } from "@/lib/listing";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = parseListParams(await searchParams);
  return {
    title: p.region ? `${p.region} 지역 홍보` : "지역별 홍보",
    description: "우리 동네 가게와 서비스를 지역별로 찾아보세요.",
    alternates: { canonical: buildHref("/region", { region: p.region }) },
  };
}

export default async function RegionPage({ searchParams }: Props) {
  const params = parseListParams(await searchParams);
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition",
      active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2 hover:border-brand hover:text-brand",
    );
  return (
    <>
      <div className="wrap pt-6 sm:pt-8">
        <nav aria-label="지역 선택" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Link href="/region" className={chip(!params.region)}>
            전체 지역
          </Link>
          {REGIONS.map((r) => (
            <Link key={r} href={buildHref("/region", { region: r })} className={chip(params.region === r)} aria-current={params.region === r ? "page" : undefined}>
              {r}
            </Link>
          ))}
        </nav>
      </div>
      <ListView
        basePath="/region"
        params={params}
        onlyWithRegion
        showRegionFilter={false}
        heading={params.region ? `${params.region} 지역 홍보` : "지역별 홍보"}
        description="오프라인 가게를 중심으로 지역 정보가 있는 홍보글을 모았어요."
        emptyTitle={params.region ? `${params.region} 지역에는 아직 홍보글이 없어요` : undefined}
      />
    </>
  );
}
