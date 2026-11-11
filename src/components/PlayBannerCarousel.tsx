"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type PlayBannerSlide = { href: string; kicker: string; title: [string, string]; note: string; cta: string; image: string; alt: string };

/** Auto-rotating promo banners. Pauses on hover/focus/touch and for reduced-motion users; swipe and dots still work. */
export function PlayBannerCarousel({ slides, interval = 5200 }: { slides: PlayBannerSlide[]; interval?: number }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((i: number) => {
    const el = track.current; if (!el) return;
    const first = el.children[0] as HTMLElement | undefined; if (!first) return;
    const step = first.offsetWidth + 20;
    const max = Math.max(0, Math.round((el.scrollWidth - el.clientWidth) / step));
    const next = i > max ? 0 : i < 0 ? max : i;
    el.scrollTo({ left: next * step, behavior: "smooth" }); setIndex(next);
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (paused) return;
    const t = setInterval(() => { if (!document.hidden) go(index + 1); }, interval);
    return () => clearInterval(t);
  }, [go, index, interval, paused]);
  const onScroll = () => {
    const el = track.current; const first = el?.children[0] as HTMLElement | undefined; if (!el || !first) return;
    setIndex(Math.round(el.scrollLeft / (first.offsetWidth + 20)));
  };
  const hold = (v: boolean) => () => setPaused(v);
  return <section className="play-carousel" aria-roledescription="carousel" aria-label="놀러가자 추천 배너" onMouseEnter={hold(true)} onMouseLeave={hold(false)} onFocus={hold(true)} onBlur={hold(false)} onTouchStart={hold(true)} onTouchEnd={() => setTimeout(hold(false), 4000)}>
    <div className="play-carousel-track" ref={track} onScroll={onScroll}>
      {slides.map((s, i) => <Link key={s.href + i} href={s.href} className="play-photo-banner play-slide" aria-label={`${s.title.join(" ")} — ${s.cta}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="play-photo" src={s.image} alt={s.alt} loading={i < 2 ? "eager" : "lazy"}/>
        <div className="play-banner-copy"><span className="play-banner-kicker">{s.kicker}</span><h2>{s.title[0]}<br/>{s.title[1]}</h2><p>{s.note}</p><span className="play-banner-cta">{s.cta} ↗</span></div>
      </Link>)}
    </div>
    <div className="play-carousel-dots" role="tablist" aria-label="배너 선택">{slides.map((s, i) => <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`${i + 1}번 배너: ${s.kicker}`} onClick={() => go(i)} className={i === index ? "on" : ""}/>)}</div>
  </section>;
}
