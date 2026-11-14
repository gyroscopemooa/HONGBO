import { freeAdTrialEnabled } from "@/lib/free-ad-trial";
import Link from "next/link";
import { Crown, Plus } from "lucide-react";
import { AD_PREMIUM_SLOTS } from "@/lib/ads";
import type { Post } from "@/lib/types";
import { PostCard } from "./PostCard";

/** 맨 뒤에 남겨 두는 "내 홍보를 여기에" 안내 칸 수 */
const PLACEHOLDERS = 2;

/**
 * 홈 상단 추천 영역 — 한 줄 5칸. 앞 3칸이 광고 자리이고, 광고가 없는 칸만 최신 홍보글이 채웁니다.
 * 뒤 2칸은 "내 홍보를 여기에" 안내 칸입니다.
 * 예) 광고 0개: 최신 3 + 안내 2 / 광고 1개: 광고 1 + 최신 2 + 안내 2 / 광고 3개: 광고 3 + 안내 2
 */
export function PremiumGrid({ ads, fill }: { ads: Post[]; fill: Post[] }) {
  const freeTrial = freeAdTrialEnabled();
  const shownAds = ads.slice(0, AD_PREMIUM_SLOTS);
  const filler = fill.filter((p) => !shownAds.some((a) => a.id === p.id)).slice(0, AD_PREMIUM_SLOTS - shownAds.length);
  const plus = PLACEHOLDERS;

  return (
    <section aria-label="추천 홍보" className="wrap pt-5 sm:pt-7">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-[-0.04em]">
          <Crown size={22} className="text-[#e0a100]" fill="currentColor" aria-hidden /> 추천 홍보
        </h2>
        <Link href="/advertise?type=premium#ad-application" className="text-[13.5px] font-medium text-muted hover:text-brand">
          상단 고정 신청하기
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {shownAds.map((p, i) => (
          <li key={`ad-${p.id}`}>
            <PostCard post={p} ad eager={i < 5} />
          </li>
        ))}
        {filler.map((p) => (
          <li key={`new-${p.id}`}>
            <PostCard post={p} />
          </li>
        ))}
        {Array.from({ length: plus }, (_, i) => (
          <li key={`empty-${i}`}>
            <Link
              href="/advertise?type=premium#ad-application"
              className="flex h-full min-h-[190px] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#e0c070] bg-[#fffbee] p-4 text-center transition hover:-translate-y-0.5 hover:bg-[#fff6d9]"
            >
              <span className="grid size-9 place-items-center rounded-full bg-[#ffe9a8] text-[#9a6b00]">
                <Plus size={18} aria-hidden />
              </span>
              <span className="text-[14px] font-bold text-ink-2">내 홍보를 여기에</span>
              <span className="text-[12px] leading-snug text-muted">
                {freeTrial ? "계정당 1회 · 7일 무료 체험" : "주 3만 원 · 월 5만 원"}
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
