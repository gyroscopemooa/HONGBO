import Link from "next/link";
import { Crown, Plus } from "lucide-react";
import { AD_PREMIUM_SLOTS } from "@/lib/ads";
import type { Post } from "@/lib/types";
import { PostCard } from "./PostCard";

/** 홈 최상단 프리미엄 고정 영역 — 최대 10칸을 슬라이드 없이 한눈에 보여줍니다. 빈 칸은 최대 5개까지만 "내 홍보를 여기에" 칸으로 보여줘요. */
export function PremiumGrid({ posts }: { posts: Post[] }) {
  const free = Math.max(AD_PREMIUM_SLOTS - posts.length, 0);
  // 마지막 줄이 들쭉날쭉하지 않게 5칸(데스크톱 열 수) 단위로 맞추되, 안내 칸은 최대 5개
  const pad = posts.length % 5 === 0 ? 0 : 5 - (posts.length % 5);
  const placeholders = Math.min(free, posts.length === 0 ? 5 : pad);

  return (
    <section aria-label="프리미엄 홍보" className="wrap pt-5 sm:pt-7">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-[-0.04em]">
          <Crown size={22} className="text-[#e0a100]" fill="currentColor" aria-hidden /> 프리미엄 홍보
          <span className="rounded-md bg-[#fff4d6] px-1.5 py-0.5 text-[11.5px] font-bold text-[#9a6b00]">광고</span>
        </h2>
        <Link href="/advertise" className="text-[13.5px] font-medium text-muted hover:text-brand">
          상단 고정 신청하기
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {posts.map((p, i) => (
          <li key={p.id}>
            <PostCard post={p} ad eager={i < 5} />
          </li>
        ))}
        {Array.from({ length: placeholders }, (_, i) => (
          <li key={`empty-${i}`}>
            <Link
              href="/advertise"
              className="flex h-full min-h-[190px] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#e0c070] bg-[#fffbee] p-4 text-center transition hover:-translate-y-0.5 hover:bg-[#fff6d9]"
            >
              <span className="grid size-9 place-items-center rounded-full bg-[#ffe9a8] text-[#9a6b00]">
                <Plus size={18} aria-hidden />
              </span>
              <span className="text-[14px] font-bold text-ink-2">내 홍보를 여기에</span>
              <span className="text-[12px] leading-snug text-muted">
                주 3만 원 · 월 5만 원
                <br />
                메인 최상단 고정
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
