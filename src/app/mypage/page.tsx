import type { Metadata } from "next";
import Link from "next/link";
import { Eye, MousePointerClick, PencilLine } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { NicknameForm } from "@/components/NicknameForm";
import { OwnerActions } from "@/components/OwnerActions";
import { PostImage } from "@/components/PostImage";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { effectiveStatus } from "@/lib/queries";
import { store } from "@/lib/store";
import { daysUntil, formatDate, relativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "내 홍보",
  robots: { index: false, follow: false },
};

export default async function MyPage() {
  const user = await requireUser("/mypage");
  const { items } = await store.listPosts({ authorId: user.id, sort: "latest", pageSize: 100 });
  const posts = items.filter((p) => p.status !== "deleted");

  return (
    <div className="wrap py-6 sm:py-9">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-black tracking-[-0.045em] sm:text-[32px]">내 홍보</h1>
          <p className="mt-1.5 text-[15px] text-muted">작성한 홍보글을 수정하고, 다시 홍보하거나 삭제할 수 있어요.</p>
        </div>
        <Link href="/write" className="btn btn-primary">
          <PencilLine size={16} aria-hidden /> 새 홍보글 쓰기
        </Link>
      </header>

      <section className="mb-6 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5" aria-label="내 정보">
        <NicknameForm nickname={user.nickname} />
        <p className="mt-2 text-xs text-faint">
          닉네임은 내 글의 상세 페이지에만 작게 표시돼요. Google 이름과 이메일은 공개되지 않아요.
        </p>
      </section>

      {user.status === "blocked" && (
        <p role="alert" className="mb-6 rounded-xl bg-brand-soft px-4 py-3 text-[14px] font-medium text-brand-dark">
          작성이 제한된 계정이에요. 자세한 내용은 문의하기로 연락해주세요.
        </p>
      )}

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-soft/60 px-6 py-14 text-center">
          <p className="text-lg font-bold">아직 작성한 홍보글이 없어요</p>
          <p className="mt-1 text-sm text-muted">지금 바로 첫 홍보글을 올려보세요. 1분이면 충분해요!</p>
          <Link href="/write" className="btn btn-primary mt-5">
            홍보글 작성하기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => {
            const status = effectiveStatus(p);
            const daysLeft = p.expiresAt ? daysUntil(p.expiresAt) : null;
            return (
              <li key={p.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-card md:flex-row md:items-center">
                <Link href={`/post/${p.id}`} className="block w-full shrink-0 overflow-hidden rounded-xl md:w-[180px]">
                  <PostImage src={p.primaryImageUrl} alt="" category={p.category} sizes="180px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={status} />
                    <CategoryBadge slug={p.category} />
                  </div>
                  <Link href={`/post/${p.id}`} className="mt-1.5 block truncate text-[17px] font-extrabold tracking-[-0.03em] hover:text-brand-dark">
                    {p.title}
                  </Link>
                  <p className="mt-0.5 truncate text-[13.5px] text-muted">{p.shortDescription}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
                    <span>등록 {formatDate(p.publishedAt)} ({relativeTime(p.publishedAt)})</span>
                    {daysLeft !== null && status === "active" && <span>노출 {daysLeft}일 남음</span>}
                    {status === "expired" && <span className="font-semibold text-[#a56200]">노출 기간이 끝났어요 — 다시 홍보하기를 눌러주세요</span>}
                    <span className="inline-flex items-center gap-1"><Eye size={13} aria-hidden /> 조회 {p.viewCount}</span>
                    <span className="inline-flex items-center gap-1"><MousePointerClick size={13} aria-hidden /> 링크 클릭 {p.clickCount}</span>
                  </p>
                </div>
                <div className="shrink-0">
                  <OwnerActions postId={p.id} canRenew={p.status === "active" || p.status === "expired"} size="sm" redirectTo="/mypage" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
