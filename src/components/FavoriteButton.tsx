"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/app/actions/favorite";
import { cn } from "@/lib/utils";

/** 마음에 드는 홍보글을 내 찜 목록에 저장합니다. 개수는 공개하지 않아요. */
export function FavoriteButton({ postId, initial, loggedIn }: { postId: number; initial: boolean; loggedIn: boolean }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const cls = "inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-brand";
  if (!loggedIn) {
    return (
      <Link href={`/auth?next=${encodeURIComponent(`/post/${postId}`)}`} className={cls} title="로그인하면 찜할 수 있어요">
        <Heart size={14} aria-hidden /> 찜하기
      </Link>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        aria-pressed={on}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await toggleFavoriteAction(postId);
            if (r.ok) setOn(r.on);
            else setError(r.message);
          })
        }
        className={cn(cls, on && "font-semibold text-brand")}
      >
        <Heart size={14} aria-hidden fill={on ? "currentColor" : "none"} /> {on ? "찜한 글" : "찜하기"}
      </button>
      {error && <span className="text-xs text-brand-dark">{error}</span>}
    </span>
  );
}
