"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** 외부 링크 이동 버튼 — 새 탭(noopener noreferrer)으로 열고, 클릭 이벤트를 가볍게 기록합니다. */
export function ExternalCta({
  href,
  postId,
  label,
  variant = "primary",
  className,
}: {
  href: string;
  postId: number;
  label: string;
  variant?: "primary" | "outline";
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      onClick={() => {
        try {
          const blob = new Blob([JSON.stringify({ type: "external_click", postId })], { type: "application/json" });
          navigator.sendBeacon?.("/api/track", blob);
        } catch {
          /* 기록 실패는 이동에 영향을 주지 않음 */
        }
      }}
      className={cn("btn", variant === "primary" ? "btn-primary btn-lg" : "btn-outline", "w-full", className)}
    >
      {label}
      <ArrowUpRight size={variant === "primary" ? 19 : 16} aria-hidden />
    </a>
  );
}
