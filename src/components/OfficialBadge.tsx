import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const OFFICIAL_LABELS = { official: "더홍보 공식", verified: "더홍보 인증" } as const;

/** 운영자가 직접 지정한 표시 (작성자는 켤 수 없음) */
export function OfficialBadge({ value, className }: { value?: "official" | "verified"; className?: string }) {
  if (!value) return null;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-md bg-brand px-1.5 py-0.5 text-[11.5px] font-extrabold text-white shadow-sm", className)}>
      <BadgeCheck size={12} aria-hidden />
      {OFFICIAL_LABELS[value]}
    </span>
  );
}
