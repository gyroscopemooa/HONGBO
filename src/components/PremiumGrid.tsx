import Link from "next/link";
import { Crown, Plus } from "lucide-react";
import type { Post } from "@/lib/types";
import { PostCard } from "./PostCard";
import { Carousel } from "./Carousel";

/** 맨 뒤에 남겨 두는 "내 홍보를 여기에" 안내 칸 수 */
const PLACEHOLDERS = 2;

/**
 * 홈 상단 추천 영역 — 활성 유료 지정과 운영자 수동 지정을 모두 가로로 넘겨 봅니다.
 * 마지막 두 칸은 항상 신청 안내로 남깁니다.
 */
export function PremiumGrid({ ads }: { ads: Post[] }) {
  const shownAds = ads;
  const plus = PLACEHOLDERS;

  return (
    <Carousel title="추천 홍보" icon={<Crown size={22} className="text-[#e0a100]" fill="currentColor" aria-hidden />} moreHref="/advertise">
        {shownAds.map((p, i) => (
          <li key={`ad-${p.id}`}>
            <PostCard post={p} ad eager={i < 5} />
          </li>
        ))}
        {Array.from({ length: plus }, (_, i) => (
          <li key={`empty-${i}`} className="self-start">
            <Link
              href="/advertise"
              className="flex min-h-[190px] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#e0c070] bg-[#fffbee] p-4 text-center transition hover:-translate-y-0.5 hover:bg-[#fff6d9]"
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
    </Carousel>
  );
}
