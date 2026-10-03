import type { PostStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAP: Record<PostStatus, { label: string; cls: string }> = {
  active: { label: "게시중", cls: "bg-[#e6f7ee] text-[#12804a]" },
  hidden: { label: "숨김", cls: "bg-[#eef0f4] text-muted" },
  blocked: { label: "차단", cls: "bg-[#ffe9e8] text-[#c93a35]" },
  expired: { label: "만료", cls: "bg-[#fff1d6] text-[#a56200]" },
  deleted: { label: "삭제", cls: "bg-[#eef0f4] text-faint" },
};

export function StatusBadge({ status, className }: { status: PostStatus; className?: string }) {
  const m = MAP[status];
  return <span className={cn("inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11.5px] font-bold", m.cls, className)}>{m.label}</span>;
}
