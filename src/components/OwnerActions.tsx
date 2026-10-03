"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deletePostAction, renewPostAction } from "@/app/actions/posts";
import { Modal } from "./Modal";

/** 작성자(또는 관리자)에게만 보이는 수정/삭제/다시 홍보하기 */
export function OwnerActions({
  postId,
  canRenew = false,
  size = "md",
  redirectTo = "/mypage",
}: {
  postId: number;
  canRenew?: boolean;
  size?: "sm" | "md";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const sm = size === "sm" ? "btn-sm" : "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/post/${postId}/edit`} className={`btn btn-outline ${sm}`}>
        <Pencil size={14} aria-hidden /> 수정
      </Link>
      {canRenew && (
        <button
          type="button"
          disabled={pending}
          className={`btn btn-outline ${sm}`}
          onClick={() =>
            start(async () => {
              const r = await renewPostAction(postId);
              setMsg(r.ok ? (r.message ?? "완료") : r.message);
              if (r.ok) router.refresh();
            })
          }
        >
          <RefreshCw size={14} aria-hidden /> 다시 홍보하기
        </button>
      )}
      <button type="button" className={`btn btn-danger ${sm}`} onClick={() => setOpen(true)}>
        <Trash2 size={14} aria-hidden /> 삭제
      </button>
      {msg && (
        <span role="status" className="text-[13px] text-muted">
          {msg}
        </span>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="홍보글을 삭제할까요?">
        <p className="text-[14.5px] leading-relaxed text-muted">삭제하면 목록과 검색에서 바로 사라져요. 이 작업은 되돌릴 수 없어요.</p>
        <div className="mt-5 flex gap-2">
          <button type="button" className="btn btn-outline flex-1" onClick={() => setOpen(false)}>
            취소
          </button>
          <button
            type="button"
            disabled={pending}
            className="btn btn-primary flex-1"
            onClick={() =>
              start(async () => {
                const r = await deletePostAction(postId);
                if (r.ok) {
                  setOpen(false);
                  router.push(redirectTo);
                  router.refresh();
                } else setMsg(r.message);
              })
            }
          >
            {pending ? "삭제 중…" : "삭제하기"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
