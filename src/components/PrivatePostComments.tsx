"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPrivatePostCommentAction, deletePrivatePostCommentAction, updatePrivatePostCommentAction } from "@/app/actions/private-post-comments";
import type { PrivatePostComment } from "@/lib/private-post-comments";

export function PrivatePostComments({ postId, comments, userId, isAdmin }: { postId: number; comments: PrivatePostComment[]; userId: string; isAdmin: boolean }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const active = comments.filter((comment) => comment.status === "active");

  return (
    <section aria-labelledby="private-comments-heading" className="mt-8 rounded-2xl border border-line bg-soft/50 p-4 sm:p-5">
      <h2 id="private-comments-heading" className="text-lg font-extrabold">비공개 댓글 · {active.length}</h2>
      <p className="mt-1 text-sm text-muted">글 작성자와 관리자만 작성·열람할 수 있으며, 다른 방문자에게는 표시되지 않아요.</p>
      {comments.length > 0 && (
        <ul className="mt-4 border-t border-line">
          {comments.map((comment) => (
            <li key={comment.id} className="border-b border-line py-3 text-sm">
              <p className="font-bold">{comment.nickname}<time className="ml-2 font-normal text-muted">{new Date(comment.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</time></p>
              {editingId === comment.id ? (
                <div className="mt-2">
                  <textarea className="field w-full" rows={3} maxLength={3000} value={editingBody} onChange={(event) => setEditingBody(event.target.value)} />
                  <div className="mt-2 flex gap-3 text-xs font-semibold">
                    <button type="button" disabled={pending} className="text-brand underline" onClick={() => start(async () => { const result = await updatePrivatePostCommentAction(comment.id, editingBody); if (!result.ok) setError(result.message); else { setEditingId(null); router.refresh(); } })}>저장</button>
                    <button type="button" disabled={pending} className="text-muted underline" onClick={() => { setEditingId(null); setEditingBody(""); }}>취소</button>
                  </div>
                </div>
              ) : <p className="mt-1 whitespace-pre-wrap break-words">{comment.body}</p>}
              {comment.status === "active" && (
                <div className="mt-2 flex gap-3 text-xs font-semibold text-muted">
                  {comment.authorId === userId && <button type="button" className="underline" onClick={() => { setEditingId(comment.id); setEditingBody(comment.body); }}>수정</button>}
                  {(comment.authorId === userId || isAdmin) && <button type="button" className="underline" onClick={() => start(async () => { const result = await deletePrivatePostCommentAction(comment.id); if (!result.ok) setError(result.message); else router.refresh(); })}>삭제</button>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <form className="mt-4" onSubmit={(event) => { event.preventDefault(); setError(""); start(async () => { const result = await addPrivatePostCommentAction(postId, body); if (!result.ok) setError(result.message); else { setBody(""); router.refresh(); } }); }}>
        <label htmlFor="private-post-comment" className="sr-only">비공개 댓글</label>
        <textarea id="private-post-comment" className="field w-full" rows={3} maxLength={3000} required value={body} onChange={(event) => setBody(event.target.value)} placeholder="작성자와 관리자에게만 보이는 댓글입니다." />
        {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
        <button disabled={pending} className="btn btn-primary mt-2">{pending ? "등록 중…" : "댓글 등록"}</button>
      </form>
    </section>
  );
}
