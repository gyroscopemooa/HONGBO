import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { EXCLUSIVE_SLUG } from "@/lib/constants";
import { store } from "@/lib/store";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PostCard } from "./PostCard";

/** "더홍보 전용 이벤트" 상단 고정 영역 (최신순 자동, 광고 아님). 전용 이벤트가 없으면 보이지 않습니다. */
export async function ExclusiveStrip({ wrap = false, limit = 5, data }: { wrap?: boolean; limit?: number; data?: { items: Post[]; total: number } }) {
  const { items, total } = data ?? (await store.listPosts({ publicOnly: true, benefit: EXCLUSIVE_SLUG, sort: "latest", page: 1, pageSize: limit }));
  if (!items.length) return null;
  return (
    <section aria-label="더홍보 전용 이벤트" className={cn(wrap ? "wrap pt-2 pb-2" : "mb-6")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.04em]">
          <Star size={19} className="text-[#d98e04]" fill="currentColor" aria-hidden /> 더홍보 전용 이벤트
          <span className="hidden text-[13px] font-medium tracking-normal text-muted sm:inline">더홍보에서만 받을 수 있는 혜택</span>
        </h2>
        <Link href="/benefit/exclusive" className="inline-flex shrink-0 items-center text-[13.5px] font-medium text-muted hover:text-brand">
          전체 {total}개 <ChevronRight size={15} aria-hidden />
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((p) => (
          <li key={p.id}>
            <PostCard post={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
