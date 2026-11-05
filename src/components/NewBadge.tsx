import { cn } from "@/lib/utils";

const NEW_DAYS = 7;

/** 새로 등록한 지 7일 이내인가 (끌어올리기로 위로 올라온 글은 해당 안 됨) */
export function isNewPost(publishedAt: string): boolean {
  const t = new Date(publishedAt).getTime();
  return Number.isFinite(t) && Date.now() - t < NEW_DAYS * 86_400_000;
}

/** NEW 배지 — 등록 후 일주일 동안만 보입니다. */
export function NewBadge({ publishedAt, className }: { publishedAt: string; className?: string }) {
  if (!isNewPost(publishedAt)) return null;
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-[5px] bg-[#16a34a] px-1 py-px align-middle text-[10px] font-black leading-tight tracking-wide text-white", className)} aria-label="새 글">
      NEW
    </span>
  );
}
