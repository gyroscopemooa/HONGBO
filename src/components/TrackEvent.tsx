"use client";

import { useEffect } from "react";

/** 화면이 열릴 때 가벼운 이벤트(조회, 검색, 글쓰기 시작)를 한 번 기록합니다. */
export function TrackEvent({ type, postId }: { type: "post_view" | "search" | "write_start"; postId?: number }) {
  useEffect(() => {
    const t = window.setTimeout(() => {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, postId }),
        keepalive: true,
      }).catch(() => {});
    }, 800); // 곧바로 이탈하는 방문(미리보기·봇)은 제외
    return () => window.clearTimeout(t);
  }, [type, postId]);
  return null;
}
