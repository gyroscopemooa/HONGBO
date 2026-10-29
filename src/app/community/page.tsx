import type { Metadata } from "next";
import Link from "next/link";
import { COMMUNITY_TOPICS } from "@/lib/community";
import { listCommunity } from "@/lib/community-store";
import { getCurrentUser } from "@/lib/auth";
import { cleanQuery, parsePositiveInt, pickFirst, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "커뮤니티", description: "홍보를 시작하고 콘텐츠와 서비스를 운영하며 만나는 질문을 함께 풀어봅니다.", alternates: { canonical: "/community" } };
export default async function CommunityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const topicValue = pickFirst(params.topic);
  const topic = topicValue && Object.hasOwn(COMMUNITY_TOPICS, topicValue) ? topicValue : undefined;
  const query = cleanQuery(params.q);
  const page = Math.min(parsePositiveInt(params.page), 10000);
  const [{ items, total }, user] = await Promise.all([listCommunity({ topic, query, page }), getCurrentUser()]);
  const pageUrl = (p: number) => `/community?${new URLSearchParams({ ...(topic ? { topic } : {}), ...(query ? { q: query } : {}), page: String(p) })}`;
  return <div className="wrap py-8 sm:py-12">
    <section className="mb-8 rounded-3xl border border-brand-line bg-brand-soft p-6 sm:p-10">
      <p className="mb-3 text-sm font-bold text-brand">더홍보 커뮤니티</p>
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">하나의 질문, 도움이 되는 답</h1>
      <p className="mt-4 max-w-2xl leading-7 text-ink-2">홍보를 시작할 때, 콘텐츠를 만들 때, 서비스를 운영할 때.<br className="hidden sm:block" /> 막히는 순간에 따라 해볼 수 있는 방법을 나눕니다.</p>
      {user?.isAdmin && <Link href="/admin/community/new" className="btn btn-primary mt-5">커뮤니티 글쓰기</Link>}
    </section>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <nav aria-label="커뮤니티 주제" className="flex flex-wrap gap-2">{[["", "전체"], ...Object.entries(COMMUNITY_TOPICS)].map(([key, label]) => <Link key={key} href={`/community?${new URLSearchParams({ ...(key ? { topic: key } : {}), ...(query ? { q: query } : {}) })}`} aria-current={(topic ?? "") === key ? "page" : undefined} className={`btn btn-sm ${(topic ?? "") === key ? "btn-primary" : "btn-outline"}`}>{label}</Link>)}</nav>
      <form action="/community" className="flex w-full gap-2 sm:w-auto">{topic && <input type="hidden" name="topic" value={topic} />}<input aria-label="커뮤니티 제목과 질문 검색" type="search" name="q" defaultValue={query} maxLength={60} placeholder="어떤 질문이 있나요?" className="field min-w-0" /><button className="btn btn-outline shrink-0">검색</button></form>
    </div>
    <p className="mb-3 text-sm text-muted">총 {total}개의 글 · 최신 발행순</p>
    {items.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map(post => <Link key={post.id} href={`/community/${post.id}`} className="group rounded-2xl border border-line p-6 transition hover:border-brand-line hover:shadow-card"><p className="text-xs font-bold text-brand">{COMMUNITY_TOPICS[post.topic]}</p><h2 className="mt-3 text-xl font-extrabold leading-7 group-hover:text-brand">{post.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{post.answer}</p><p className="mt-6 text-xs text-faint">더홍보 운영팀 · {formatDate(post.publishedAt!)}</p></Link>)}</div> : <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center"><h2 className="text-lg font-bold">{query || topic ? "조건에 맞는 글이 없습니다." : "첫 번째 이야기를 준비하고 있어요."}</h2><p className="mt-2 text-muted">{query || topic ? "다른 검색어나 주제로 찾아보세요." : "실제로 도움이 되는 질문과 답을 차근차근 쌓아갑니다."}</p></div>}
    <nav aria-label="게시글 페이지" className="mt-8 flex items-center justify-center gap-4">{page > 1 && <Link className="btn btn-outline" href={pageUrl(page - 1)}>이전</Link>}<span className="text-sm text-muted">{page} 페이지</span>{page * 12 < total && <Link className="btn btn-outline" href={pageUrl(page + 1)}>다음</Link>}</nav>
  </div>;
}
