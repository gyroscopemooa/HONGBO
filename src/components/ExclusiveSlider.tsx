"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { loadExclusivePage } from "@/app/actions/exclusive";
import { cn } from "@/lib/utils";

type Card = { id: number; node: ReactNode };

export function ExclusiveSlider({ wrap, initialCards, initialTotal }: { wrap: boolean; initialCards: Card[]; initialTotal: number }) {
  const list = useRef<HTMLUListElement>(null);
  const sentinel = useRef<HTMLLIElement>(null);
  const busy = useRef(false);
  const page = useRef(1);
  const [cards, setCards] = useState(initialCards);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialCards.length < initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = list.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    try {
      const result = await loadExclusivePage(page.current + 1);
      setCards(previous => {
        const seen = new Set(previous.map(card => card.id));
        return [...previous, ...result.cards.filter(card => !seen.has(card.id))];
      });
      page.current += 1;
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [hasMore]);

  useEffect(() => {
    update();
    const el = list.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update, cards, hasMore]);

  useEffect(() => {
    if (!hasMore || error || !sentinel.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void loadMore();
    }, { root: list.current, rootMargin: "0px 200px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, error, loadMore, cards]);

  const move = (direction: number) => {
    const el = list.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return (
    <section aria-label="더홍보 전용 이벤트" className={cn(wrap ? "wrap pt-2 pb-2" : "mb-6", "min-w-0")}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.04em]">
          <Star size={19} className="text-[#d98e04]" fill="currentColor" aria-hidden /> 더홍보 전용 이벤트
          <span className="hidden text-[13px] font-medium tracking-normal text-muted xl:inline">더홍보에서만 받을 수 있는 혜택</span>
        </h2>
        <div className="flex items-center gap-2">
          <Link href="/benefit/exclusive" className="inline-flex shrink-0 items-center text-[13.5px] font-medium text-muted hover:text-brand">전체 {total}개 <ChevronRight size={15} aria-hidden /></Link>
          <button type="button" aria-label="이전 전용 이벤트" disabled={!canPrev} onClick={() => move(-1)} className="flex size-8 items-center justify-center rounded-full border border-line hover:text-brand disabled:opacity-40"><ChevronLeft size={17} aria-hidden /></button>
          <button type="button" aria-label="다음 전용 이벤트" disabled={!canNext} onClick={() => move(1)} className="flex size-8 items-center justify-center rounded-full border border-line hover:text-brand disabled:opacity-40"><ChevronRight size={17} aria-hidden /></button>
        </div>
      </div>
      <ul ref={list} onScroll={update} tabIndex={0} aria-label="최신순 전용 이벤트 목록" aria-busy={loading} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pt-1 sm:gap-4 [&>li]:shrink-0 [&>li]:snap-start [&>li]:basis-[calc((100%-12px)/2.2)] sm:[&>li]:basis-[calc((100%-32px)/3)] lg:[&>li]:basis-[calc((100%-48px)/4)] xl:[&>li]:basis-[calc((100%-64px)/5)]">
        {cards.map(card => <li key={card.id}>{card.node}</li>)}
        {hasMore && <li ref={sentinel} className="flex min-h-40 items-center justify-center"><button type="button" disabled={loading} onClick={() => void loadMore()} className="btn btn-outline text-sm">{loading ? "불러오는 중…" : error ? "다시 불러오기" : "다음 혜택 보기"}</button></li>}
      </ul>
      <p role="status" className={error ? "mt-2 text-sm text-muted" : "sr-only"}>{error ? "혜택을 불러오지 못했어요. 다시 시도하거나 전체 목록을 이용해주세요." : loading ? "다음 혜택을 불러오는 중입니다." : ""}</p>
    </section>
  );
}
