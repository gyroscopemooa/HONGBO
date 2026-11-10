import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listMemberNotifications } from "@/lib/member-community-store";
import { MarkMemberNotificationsRead } from "@/components/MemberInteractions";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "내 커뮤니티 알림",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const user = await requireUser("/talk/notifications");
  const rows = await listMemberNotifications(user.id);
  return (
    <div className="wrap max-w-[800px] py-8">
      <Link className="text-brand" href="/talk">
        ← 회원 커뮤니티
      </Link>
      <div className="my-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black">내 커뮤니티 알림</h1>
        <MarkMemberNotificationsRead />
      </div>
      <p className="mb-4 text-sm text-muted">
        내 글의 댓글과 내 댓글에 달린 답글을 알려드려요. 이메일·휴대폰 푸시
        알림은 발송하지 않습니다.
      </p>
      <ul className="divide-y divide-line">
        {rows.map((n) => (
          <li key={n.id}>
            <Link
              className={`block rounded-xl p-4 ${n.read ? "" : "bg-brand-soft font-bold"}`}
              href={`/talk/${n.postId}#comment-${n.commentId}`}
            >
              {n.read ? "" : "● "}
              {n.kind === "reply"
                ? "내 댓글에 답글이 달렸어요."
                : "내 글에 새 댓글이 달렸어요."}
              <span className="mt-1 block text-xs font-normal text-muted">
                {new Date(n.createdAt).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!rows.length && <p className="py-10 text-muted">아직 알림이 없어요.</p>}
    </div>
  );
}
