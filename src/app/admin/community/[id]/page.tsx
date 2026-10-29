import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityForm } from "@/components/CommunityForm";
import { getCommunity } from "@/lib/community-store";
import { requireAdmin } from "@/lib/auth";
export default async function CommunityEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const post = id === "new" ? undefined : await getCommunity(id, true);
  if (post === null) notFound();
  return <div className="mx-auto max-w-3xl"><Link className="text-sm text-muted" href="/admin/community">← 커뮤니티 관리</Link><h1 className="my-5 text-2xl font-extrabold">{post ? "커뮤니티 글 수정" : "새 커뮤니티 글"}</h1>
    {(await searchParams).saved === "1" && <p role="status" className="mb-5 rounded-xl bg-green-50 p-4 text-green-800">저장했습니다. {post?.status === "published" ? <Link className="underline" href={`/community/${id}`}>공개된 글 보기 →</Link> : "현재 비공개 초안입니다."}</p>}
    <CommunityForm post={post} />
  </div>;
}
