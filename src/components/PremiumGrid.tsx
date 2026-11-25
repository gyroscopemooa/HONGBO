import { freeAdTrialEnabled } from "@/lib/free-ad-trial";
import Link from "next/link";
import { Crown, Plus } from "lucide-react";
import type { Post } from "@/lib/types";
import { dailyPageOffset, PREMIUM_PAGE_SIZE } from "@/lib/ads";
import { PostCard } from "./PostCard";
import { PremiumSlider } from "./PremiumSlider";

/** 광고가 적을 때 최신 홍보글로 채워 최소로 보여 주는 카드 수 */
export const PREMIUM_MIN_SHOWN = 3;

/**
 * 홈 상단 추천 영역 — 운영자 고정 광고가 맨 앞, 그다음 노출 중인 광고 전부.
 * 한 페이지는 10칸(2줄)이고 11개부터는 페이지 슬라이드로 자동 넘어가요. 뒤 페이지가 손해 보지 않게
 * 날마다 시작 페이지가 바뀝니다(운영자 고정 광고는 항상 첫 칸). 광고가 3개보다 적으면 최신 홍보글이 채우고,
 * 마지막 페이지에 남는 자리가 있을 때만 신청 안내 칸을 최대 2개 붙여요.
 */
export function PremiumGrid({ ads, fill }: { ads: Post[]; fill: Post[] }) {
  const freeTrial = freeAdTrialEnabled();
  const filler = fill.filter((p) => !ads.some((a) => a.id === p.id)).slice(0, Math.max(0, PREMIUM_MIN_SHOWN - ads.length));
  const pinned = ads[0]?.adPinned ? ads[0] : null;
  const rest = pinned ? ads.slice(1) : ads;
  const total = ads.length + filler.length;
  const pageCount = Math.max(1, Math.ceil(total / PREMIUM_PAGE_SIZE));
  const shift = dailyPageOffset(pageCount) * PREMIUM_PAGE_SIZE;
  const rot = rest.length ? shift % rest.length : 0;
  const ordered = [...(pinned ? [pinned] : []), ...rest.slice(rot), ...rest.slice(0, rot)];
  const cards: Array<{ key: string; post?: Post; ad?: boolean }> = [
    ...ordered.map((p) => ({ key: `ad-${p.id}`, post: p, ad: true })),
    ...filler.map((p) => ({ key: `new-${p.id}`, post: p })),
  ];
  // Do not create an otherwise empty slide solely for ad application tiles.
  const adPages = Math.max(1, Math.ceil(cards.length / PREMIUM_PAGE_SIZE));
  const remaining = adPages * PREMIUM_PAGE_SIZE - cards.length;
  const plus = Math.min(2, remaining);
  for (let i = 0; i < plus; i++) cards.push({ key: `empty-${i}` });
  const pages = Array.from({ length: Math.ceil(cards.length / PREMIUM_PAGE_SIZE) }, (_, i) => cards.slice(i * PREMIUM_PAGE_SIZE, (i + 1) * PREMIUM_PAGE_SIZE));

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
      <PremiumSlider>
        {pages.map((page, pi) => (
          <ul key={pi} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {page.map((c, i) => (
              <li key={c.key}>
                {c.post ? (
                  <PostCard post={c.post} ad={c.ad} eager={pi === 0 && i < 5} />
                ) : (
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
                )}
              </li>
            ))}
          </ul>
        ))}
      </PremiumSlider>
    </section>
  );
}
