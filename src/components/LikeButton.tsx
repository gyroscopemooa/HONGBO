"use client";

import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleLikeAction } from "@/app/actions/like";
import { cn, formatCount } from "@/lib/utils";

interface Props {
  postId: number;
  initial: boolean;
  initialCount: number;
  loggedIn: boolean;
}

/** 찜하기와 별개로 게시글의 공개 좋아요 수를 표시합니다. */
export function LikeButton({ postId, initial, initialCount, loggedIn }: Props) {
  const [on, setOn] = useState(initial);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cls = "inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-brand";

  if (!loggedIn) {
    return (
      <Link href={`/auth?next=${encodeURIComponent(`/post/${postId}`)}`} className={cls} title="로그인하면 좋아요를 누를 수 있어요">
        <ThumbsUp size={14} aria-hidden /> 좋아요 {formatCount(count)}
      </Link>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        aria-pressed={on}
        aria-label={`좋아요 ${on ? "취소" : "누르기"}, 현재 ${count}개`}
        onClick={() => start(async () => {
          setError(null);
          const result = await toggleLikeAction(postId);
          if (result.ok) {
            setOn(result.on);
            setCount(result.count);
          } else {
            setError(result.message);
          }
        })}
        className={cn(cls, on && "font-semibold text-brand", pending && "opacity-60")}
      >
        <ThumbsUp size={14} aria-hidden fill={on ? "currentColor" : "none"} />
        좋아요 {formatCount(count)}
      </button>
      {error && <span role="alert" className="max-w-[220px] text-xs leading-snug text-brand-dark">{error}</span>}
    </span>
  );
}
