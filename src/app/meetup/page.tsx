import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { listMeetup } from "@/lib/meetup-store";
import { cleanQuery, parsePositiveInt, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "홍보소모임",
  description: "홍보하는 사람들이 모여 자유롭게 이야기하는 게시판이에요.",
  alternates: { canonical: "/meetup" },
};

const PAGE_SIZE = 20;

export default async function MeetupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = cleanQuery(params.q);
  const page = Math.min(parsePositiveInt(params.page), 10000);
  const { items, total } = await listMeetup({ page, pageSize: PAGE_SIZE, query });
  const hrefFor = (p: number) => `/meetup?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`;

  return (
    <div className="wrap py-8 sm:py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-black tracking-[-0.04em]">홍보소모임</h1>
          <p className="mt-1 text-[14px] text-muted">홍보 이야기, 질문, 고민을 자유롭게 나눠요. 글쓰기는 로그인 후 가능해요.</p>
        </div>
        <Link href="/meetup/write" className="btn btn-primary">
          <PenLine size={16} aria-hidden /> 글쓰기
        </Link>
      </div>

      <form action="/meetup" className="mb-4 flex gap-2">
        <input aria-label="홍보소모임 검색" type="search" name="q" defaultValue={query} maxLength={60} placeholder="제목이나 내용으로 검색" className="field min-w-0 flex-1" />
        <button className="btn btn-outline shrink-0">검색</button>
      </form>

      <p className="mb-2 text-sm text-muted">총 {total.toLocaleString()}개의 글</p>
      {items.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/meetup/${p.id}`} className="block px-4 py-3.5 transition hover:bg-soft sm:px-5">
                <p className="truncate text-[15.5px] font-bold text-ink">{p.title}</p>
                <p className="mt-0.5 line-clamp-1 text-[13.5px] text-muted">{p.body}</p>
                <p className="mt-1.5 text-xs text-faint">
                  {p.nickname} · {relativeTime(p.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <h2 className="text-lg font-bold">{query ? "검색 결과가 없어요." : "아직 올라온 글이 없어요."}</h2>
          <p className="mt-2 text-muted">{query ? "다른 검색어로 찾아보세요." : "첫 글을 남겨보세요."}</p>
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} hrefFor={hrefFor} />
    </div>
  );
}
