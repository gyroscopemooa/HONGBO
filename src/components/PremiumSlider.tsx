"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Only the active page participates in layout; shorter pages never inherit the tallest page's height. */
export function PremiumSlider({ children }: { children: React.ReactNode }) {
  const slides = Children.toArray(children);
  const pages = slides.length;
  const root = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);
  const focused = useRef(false);
  const visible = useRef(false);
  const pausedUntil = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [cur, setCur] = useState(0);
  const active = Math.min(cur, Math.max(0, pages - 1));
  const go = useCallback((i: number) => {
    if (pages < 2) return;
    pausedUntil.current = Date.now() + 8000;
    setCur((i + pages) % pages);
  }, [pages]);

  useEffect(() => {
    const el = root.current;
    if (!el || pages < 2) return;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [pages]);

  useEffect(() => {
    if (pages < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!visible.current || hovering.current || focused.current || document.hidden || start.current || Date.now() < pausedUntil.current) return;
      setCur(i => (i + 1) % pages);
    }, 6000);
    return () => window.clearInterval(id);
  }, [pages]);

  if (!pages) return null;
  return (
    <div ref={root} className="relative min-w-0"
      onMouseEnter={() => { hovering.current = true; }}
      onMouseLeave={() => { hovering.current = false; }}
      onFocusCapture={() => { focused.current = true; }}
      onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focused.current = false; }}
      onTouchStart={e => {
        if (e.touches.length !== 1) { start.current = null; return; }
        start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        pausedUntil.current = Date.now() + 8000;
      }}
      onTouchCancel={() => { start.current = null; }}
      onTouchEnd={e => {
        const first = start.current;
        start.current = null;
        pausedUntil.current = Date.now() + 8000;
        const last = e.changedTouches[0];
        if (!first || !last) return;
        const dx = last.clientX - first.x, dy = last.clientY - first.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(active + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="min-w-0 overflow-hidden [touch-action:pan-y_pinch-zoom]">
        {slides.map((slide, i) => (
          <div key={i} hidden={i !== active} aria-hidden={i !== active} className="min-w-0">
            {slide}
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button type="button" aria-label="이전 페이지" onClick={() => go(active - 1)} className="grid size-8 place-items-center rounded-full border border-line bg-white hover:bg-soft">
            <ChevronLeft size={16} aria-hidden />
          </button>
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button key={i} type="button" aria-label={`${i + 1}페이지`} aria-current={i === active ? "true" : undefined} onClick={() => go(i)} className={`h-2 rounded-full transition-all ${i === active ? "w-5 bg-brand" : "w-2 bg-line"}`} />
            ))}
          </div>
          <button type="button" aria-label="다음 페이지" onClick={() => go(active + 1)} className="grid size-8 place-items-center rounded-full border border-line bg-white hover:bg-soft">
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
