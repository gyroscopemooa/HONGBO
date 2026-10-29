import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunity, listCommunity } from "@/lib/community-store";
import { COMMUNITY_TOPICS } from "@/lib/community";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getCommunity(id);
  if (!post) return { title: "글을 찾을 수 없습니다", robots: { index: false } };
  return { title: post.title, description: post.answer.slice(0, 160), alternates: { canonical: `/community/${id}` }, openGraph: { type: "article", title: post.title, description: post.answer.slice(0, 160), publishedTime: post.publishedAt!, modifiedTime: post.updatedAt } };
}
export default async function CommunityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getCommunity(id);
  if (!post) notFound();
  const { items: related } = await listCommunity({ topic: post.topic, exclude: id, pageSize: 3 });
  return <div className="wrap py-8 sm:py-12"><div className="mx-auto max-w-3xl">
    <Link href="/community" className="text-sm font-semibold text-muted hover:text-brand">← 커뮤니티 목록</Link>
    <article className="mt-8">
      <p className="font-bold text-brand">{COMMUNITY_TOPICS[post.topic]}</p>
      <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-5 text-sm text-muted">더홍보 운영팀 · 발행 {formatDate(post.publishedAt!)} · 수정 {formatDate(post.updatedAt)}</p>
      <p className="mt-2 text-xs text-muted">더홍보 운영자가 작성한 안내입니다.</p>
      <p className="mt-7 whitespace-pre-wrap text-lg leading-8">{post.answer}</p>
      <aside className="my-8 rounded-2xl bg-brand-soft p-5"><h2 className="text-sm font-bold text-brand">이 글이 해결하는 질문</h2><p className="mt-2 font-semibold">{post.question}</p></aside>
      <section className="my-9"><h2 className="mb-4 text-2xl font-extrabold">따라 할 수 있는 방법</h2><p className="whitespace-pre-wrap leading-8">{post.steps}</p></section>
      <section className="my-9"><h2 className="mb-4 text-2xl font-extrabold">안 되는 경우와 대안</h2><p className="whitespace-pre-wrap leading-8">{post.limitations}</p></section>
      {!!post.links.length && <section className="my-9"><h2 className="mb-4 text-2xl font-extrabold">함께 확인하면 좋은 안내</h2><ul className="space-y-3">{post.links.map((link, i) => <li key={i}><a href={link.url} className="font-semibold text-brand underline underline-offset-4">{link.label} →</a></li>)}</ul></section>}
      {post.service && <aside className="my-9 rounded-2xl border border-brand-line bg-brand-soft p-6"><h2 className="text-lg font-bold">직접 실행해 보세요</h2><a className="btn btn-primary mt-4" href={post.service.url}>{post.service.label} →</a></aside>}
    </article>
    {!!related.length && <section className="mt-12 border-t border-line pt-8"><h2 className="text-xl font-extrabold">같은 주제의 최근 글</h2><div className="mt-4 space-y-3">{related.map(item => <Link key={item.id} href={`/community/${item.id}`} className="block rounded-xl border border-line p-4 hover:border-brand-line"><span className="font-bold">{item.title}</span><p className="mt-1 text-sm text-muted">{item.question}</p></Link>)}</div></section>}
  </div></div>;
}
