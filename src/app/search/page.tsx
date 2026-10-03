import type { Metadata } from "next";
import { Search } from "lucide-react";
import { ListView } from "@/components/ListView";
import { TrackEvent } from "@/components/TrackEvent";
import { parseListParams, type SearchParams } from "@/lib/listing";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = parseListParams(await searchParams);
  return {
    title: q ? `'${q}' 검색 결과` : "홍보 검색",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = parseListParams(await searchParams);
  const { q } = params;

  return (
    <>
      <div className="wrap pt-6 md:hidden">
        <form action="/search" role="search" className="relative">
          <label htmlFor="m-search" className="sr-only">
            홍보 검색
          </label>
          <input
            id="m-search"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={60}
            autoFocus={!q}
            placeholder="무엇을 찾고 있나요?"
            className="h-12 w-full rounded-full border border-line bg-soft pl-5 pr-12 text-[15px] focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10"
          />
          <button type="submit" aria-label="검색" className="absolute right-1.5 top-1.5 flex size-9 items-center justify-center rounded-full text-ink-2">
            <Search size={19} aria-hidden />
          </button>
        </form>
      </div>
      {q && <TrackEvent type="search" />}
      <ListView
        basePath="/search"
        params={params}
        query={q || undefined}
        keepParams={{ q: q || undefined }}
        heading={q ? <>&lsquo;{q}&rsquo; 검색 결과</> : "홍보 검색"}
        description={q ? undefined : "제목, 소개, 설명, 태그에서 찾아드려요."}
        emptyTitle={q ? undefined : "검색어를 입력해주세요"}
      />
    </>
  );
}
