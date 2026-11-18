"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * 추천 홍보 페이지 슬라이더 — 자식 하나가 한 페이지(2줄)예요. 페이지가 2개 이상이면
 * 몇 초마다 다음 페이지로 저절로 넘어가고, 화살표·점으로도 넘길 수 있어요. 마우스를 올리거나 만지면 멈춥니다.
 */
export function PremiumSlider({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const pages = Children.count(children);
  const [cur, setCur] = useState(0);

  const go = useCallback(
    (i: number) => {
      const el = ref.current;
      if (!el || pages < 2) return;
      const n = (i + pages) % pages;
      el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
    },
    [pages],
  );

  const onScroll = () => {
    const el = ref.current;
    if (el && el.clientWidth) setCur(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    if (pages < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      const el = ref.current;
      if (!paused.current && el) go(Math.round(el.scrollLeft / el.clientWidth) + 1);
    }, 6000);
    return () => window.clearInterval(t);
  }, [pages, go]);

  const hold = {
    onMouseEnter: () => { paused.current = true; },
    onMouseLeave: () => { paused.current = false; },
    onTouchStart: () => { paused.current = true; },
    onTouchEnd: () => { window.setTimeout(() => { paused.current = false; }, 8000); },
    onFocus: () => { paused.current = true; },
    onBlur: () => { paused.current = false; },
  };

  return (
    <div className="relative" {...hold}>
      <div ref={ref} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {Children.map(children, (c, i) => (
          <div key={i} className="w-full shrink-0 snap-start" aria-hidden={i !== cur}>
            {c}
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button type="button" aria-label="이전 페이지" onClick={() => go(cur - 1)} className="grid size-8 place-items-center rounded-full border border-line bg-white hover:bg-soft">
            <ChevronLeft size={16} aria-hidden />
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} type="button" aria-label={`${i + 1}페이지`} onClick={() => go(i)} className={`h-2 rounded-full transition-all ${i === cur ? "w-5 bg-brand" : "w-2 bg-line"}`} />
            ))}
          </div>
          <button type="button" aria-label="다음 페이지" onClick={() => go(cur + 1)} className="grid size-8 place-items-center rounded-full border border-line bg-white hover:bg-soft">
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
