"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 와이드 배너 슬라이드 — 5초마다 자동으로 넘어가고, 터치/스크롤로 직접 넘길 수도 있어요.
 * 마우스를 올려 두거나 "동작 줄이기" 설정이면 자동으로 넘기지 않습니다.
 * children 은 같은 비율의 슬라이드(li)들입니다.
 */
export function BannerSlider({ children, count, label }: { children: React.ReactNode; count: number; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((i: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => go((index + 1) % count), 5000);
    return () => window.clearInterval(t);
  }, [count, paused, index, go]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <ul ref={ref} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[20px]">
        {children}
      </ul>
      {count > 1 && (
        <div className="mt-2 flex justify-center gap-1.5" role="tablist" aria-label="배너 선택">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}번째 배너`}
              onClick={() => go(i)}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-ink-2" : "w-1.5 bg-line")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 배너 자리가 남아 있을 때 마지막 장에 붙는 "내 광고 배너를 여기에" 안내 슬라이드 */
export function BannerPlaceholder({ priceText }: { priceText: string }) {
  return (
    <Link
      href="/advertise?type=banner#ad-application"
      className="flex aspect-[2.2/1] flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[#e0c070] bg-[#fffbee] text-center transition hover:bg-[#fff6d9] sm:aspect-[4/1]"
    >
      <span className="grid size-9 place-items-center rounded-full bg-[#ffe9a8] text-[#9a6b00]">
        <Plus size={18} aria-hidden />
      </span>
      <span className="text-[15px] font-bold text-ink-2 sm:text-[17px]">내 광고 배너를 여기에</span>
      <span className="text-[12.5px] text-muted sm:text-[13.5px]">{priceText} · 메인 상단 와이드 배너</span>
    </Link>
  );
}
