import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  listMemberReports,
  getMemberPost,
  listHiddenMemberPosts,
} from "@/lib/member-community-store";
import { MemberModeration } from "@/components/MemberInteractions";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; hiddenPage?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(params.page) || 1));
  const hiddenPage = Math.max(
    1,
    Math.min(10000, Number(params.hiddenPage) || 1),
  );
  await requireAdmin();
  const reports = await listMemberReports(page);
  const hiddenPosts = await listHiddenMemberPosts(hiddenPage);
  const rows = await Promise.all(
    reports.map(async (r) => ({
      report: r,
      post: await getMemberPost(r.postId, true),
    })),
  );
  return (
    <section>
      <h2 className="text-xl font-bold">회원 커뮤니티 신고</h2>
      <p className="my-2 text-sm text-muted">
        신고 내용을 확인한 후 필요한 글을 숨길 수 있습니다.
      </p>
      <ul className="divide-y divide-line">
        {rows.map(({ report: r, post }) => (
          <li key={r.id} className="space-y-3 py-4">
            <Link
              className="font-bold text-brand"
              href={`/talk/${r.postId}${r.commentId ? `#comment-${r.commentId}` : ""}`}
            >
              {post?.title ?? `글 #${r.postId}`}
            </Link>
            <p className="whitespace-pre-wrap break-words">{r.reason}</p>
            <p className="text-sm text-muted">
              {r.commentId ? `댓글 #${r.commentId} 신고` : "게시글 신고"} ·{" "}
              {post?.status}
            </p>
            {post && post.status !== "deleted" && (
              <MemberModeration
                postId={r.postId}
                commentId={r.commentId}
                hidden={post.status === "hidden"}
              />
            )}
          </li>
        ))}
      </ul>
      {!rows.length && (
        <p className="py-8 text-muted">접수된 신고가 없습니다.</p>
      )}
      <nav className="flex gap-3">
        {page > 1 && (
          <Link href={`/admin/talk?page=${page - 1}&hiddenPage=${hiddenPage}`}>
            이전 신고
          </Link>
        )}
        {reports.length === 100 && (
          <Link href={`/admin/talk?page=${page + 1}&hiddenPage=${hiddenPage}`}>
            다음 신고
          </Link>
        )}
      </nav>
      <h2 className="mt-8 text-xl font-bold">숨긴 글</h2>
      <ul className="divide-y divide-line">
        {hiddenPosts.map((p) => (
          <li key={p.id} className="space-y-3 py-4">
            <h3 className="font-bold">{p.title}</h3>
            <p className="whitespace-pre-wrap break-words">{p.body}</p>
            <MemberModeration postId={p.id} hidden />
          </li>
        ))}
      </ul>
      <nav className="flex gap-3">
        {hiddenPage > 1 && (
          <Link href={`/admin/talk?page=${page}&hiddenPage=${hiddenPage - 1}`}>
            이전 숨긴 글
          </Link>
        )}
        {hiddenPosts.length === 100 && (
          <Link href={`/admin/talk?page=${page}&hiddenPage=${hiddenPage + 1}`}>
            다음 숨긴 글
          </Link>
        )}
      </nav>
    </section>
  );
}
