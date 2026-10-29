import Link from "next/link";
import { listCommunity } from "@/lib/community-store";
import { formatDate, parsePositiveInt } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth";
export default async function AdminCommunity({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const page = Math.min(parsePositiveInt((await searchParams).page), 10000);
  const { items, total } = await listCommunity({ admin: true, page, pageSize: 20 });
  return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold">커뮤니티 관리</h1><Link href="/admin/community/new" className="btn btn-primary">새 글 작성</Link></div><p className="text-sm text-muted">총 {total}개 · 초안은 관리자에게만 보입니다. 공개 후에도 수정하거나 비공개로 전환할 수 있습니다.</p>
    {items.map(post => <Link key={post.id} href={`/admin/community/${post.id}`} className="block rounded-xl border border-line p-5 hover:bg-soft"><span className="mr-3 text-xs font-bold text-brand">{post.status === "draft" ? "초안" : "공개"}</span><span className="font-bold">{post.title}</span><p className="mt-2 text-xs text-muted">수정 {formatDate(post.updatedAt)}</p></Link>)}
    {!items.length && <p className="rounded-xl bg-soft p-8 text-center text-muted">아직 작성된 글이 없습니다.</p>}
    <nav className="flex gap-4" aria-label="관리 목록 페이지">{page > 1 && <Link href={`/admin/community?page=${page - 1}`} className="btn btn-outline">이전</Link>}{page * 20 < total && <Link href={`/admin/community?page=${page + 1}`} className="btn btn-outline">다음</Link>}</nav>
  </section>;
}
