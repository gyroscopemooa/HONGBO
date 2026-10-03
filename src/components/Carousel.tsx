"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** 가로 스냅 스크롤 캐러셀 — 데스크톱 6개 / 태블릿 4개 / 모바일 2개가 한 줄에 보입니다. */
export function Carousel({
  title,
  icon,
  moreHref,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  moreHref?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const scrollBy = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section aria-label={title} className="wrap py-4 sm:py-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.04em] sm:text-[21px]">
          {icon}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {moreHref && (
            <Link href={moreHref} className="mr-1 inline-flex items-center text-[13.5px] font-medium text-muted hover:text-brand">
              더보기 <ChevronRight size={15} aria-hidden />
            </Link>
          )}
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canPrev}
            aria-label="이전"
            className="hidden size-8 items-center justify-center rounded-full border border-line bg-white text-ink-2 transition hover:border-brand hover:text-brand disabled:cursor-default disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-2 sm:flex"
          >
            <ChevronLeft size={17} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canNext}
            aria-label="다음"
            className="hidden size-8 items-center justify-center rounded-full border border-line bg-white text-ink-2 transition hover:border-brand hover:text-brand disabled:cursor-default disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-2 sm:flex"
          >
            <ChevronRight size={17} aria-hidden />
          </button>
        </div>
      </div>
      <ul
        ref={ref}
        onScroll={update}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 pt-1 [scroll-padding-inline:16px] sm:mx-0 sm:px-0 sm:[scroll-padding-inline:0] [&>li]:shrink-0 [&>li]:snap-start [&>li]:basis-[calc((100%-12px)/2.2)] sm:[&>li]:basis-[calc((100%-36px)/4)] lg:[&>li]:basis-[calc((100%-60px)/6)]"
      >
        {children}
      </ul>
    </section>
  );
}
