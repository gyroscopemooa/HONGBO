import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EXCLUSIVE_LABEL, EXCLUSIVE_SLUG } from "@/lib/constants";
import { store } from "@/lib/store";
import { PostCard } from "./PostCard";

/** 전체 홍보글 맨 위에 보이는 "더홍보 전용 이벤트" 영역 (최신순 자동, 광고 아님) */
export async function ExclusiveStrip() {
  const { items, total } = await store.listPosts({ publicOnly: true, benefit: EXCLUSIVE_SLUG, sort: "latest", page: 1, pageSize: 4 });
  if (!items.length) return null;
  return (
    <section aria-label="더홍보 전용 이벤트" className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#ffe49a] via-[#f0b429] to-[#c9830a] p-[2px] shadow-[0_8px_26px_-8px_rgba(201,131,10,0.6)]">
      <div className="rounded-[14px] bg-gradient-to-b from-[#fffdf6] to-[#fff4d6] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[#a86a0b] via-[#e0a31a] to-[#a86a0b] px-2 py-0.5 text-[12px] font-extrabold text-white">★ {EXCLUSIVE_LABEL} 이벤트</p>
            <p className="mt-1.5 text-[13.5px] text-ink-2">더홍보에서만 받을 수 있는 특별 혜택이에요. &quot;더홍보 보고 왔어요&quot;를 기억하세요.</p>
          </div>
          <Link href="/benefit/exclusive" className="inline-flex items-center text-[13.5px] font-bold text-[#8a5a0a] hover:underline">
            전체 {total}개 보기 <ChevronRight size={15} aria-hidden />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((p) => (
            <li key={p.id}>
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
