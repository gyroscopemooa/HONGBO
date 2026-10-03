import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/PostForm";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "홍보글 수정",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  if (!/^\d{1,12}$/.test(raw)) notFound();
  const id = Number(raw);
  const user = await requireUser(`/post/${id}/edit`);
  const post = await store.getPost(id);
  if (!post || post.status === "deleted") notFound();
  // 작성자 본인 또는 관리자만 수정 가능 — 그 외에는 글의 존재를 알리지 않습니다.
  if (post.authorId !== user.id && !user.isAdmin) notFound();

  return (
    <div className="wrap py-6 sm:py-9">
      <header className="mb-6">
        <h1 className="text-[26px] font-black tracking-[-0.045em] sm:text-[32px]">홍보글 수정</h1>
        <p className="mt-1.5 text-[15px] text-muted">내용을 고치고 저장하면 바로 반영돼요.</p>
      </header>
      <PostForm mode="edit" post={post} />
    </div>
  );
}
