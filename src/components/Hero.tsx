"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const banners = [
  {
    src: "/hero-banner.png",
    alt: "홍보하고, 알려보세요! 한 번 올리면 여러 사람에게 더홍보. 앱, 사이트, 가게, 상품, 모임까지 누구나 무료로 쉽고 빠르게 홍보할 수 있어요.",
  },
  {
    src: "/hero-banner-story.png",
    alt: "내 이야기, 내 상품, 더 많은 사람에게 닿게. 복잡한 절차 없이 글 한 번 작성하면 관심 있는 사람들이 쉽게 발견할 수 있어요.",
  },
  {
    src: "/hero-banner-categories.png",
    alt: "앱부터 오프라인 가게까지, 한 곳에서 자유롭게 홍보. 웹사이트, 서비스, 상품, 콘텐츠, 이벤트를 카테고리별로 소개해보세요.",
  },
  {
    src: "/hero-banner-reach.png",
    alt: "홍보는 더 간단하게, 도달은 더 넓게. 더홍보에서 앱, 서비스, 가게, 상품, 콘텐츠를 깔끔하게 소개하고 더 많은 사람에게 보여주세요.",
  },
  {
    src: "/hero-banner-discovery.png",
    alt: "내 서비스와 이야기를 사람들이 더 쉽게 발견하게. 복잡한 절차 없이 글을 올리고 관심 있는 사람들과 연결해보세요.",
  },
  {
    src: "/hero-banner-everything.png",
    alt: "무엇이든 올리고 더 많은 사람에게 알려보세요. 앱, 가게, 상품, 콘텐츠, 이벤트까지 한 곳에서 자유롭게 홍보할 수 있어요.",
  },
  {
    src: "/hero-banner-community.png",
    alt: "좋은 이야기와 상품을 더 많은 사람에게. 가게, 서비스, 콘텐츠, 이벤트까지 한 번의 등록으로 널리 알려보세요.",
  },
] as const;

/** 인플09 협업 안내 슬라이드 — url 이 있으면 인플09 전용 신청 페이지로, 없으면(개발 미리보기) 비활성으로 보입니다. */
function Infl09Slide({ url, active }: { url: string | null; active: boolean }) {
  const inner = (
    <div className="flex size-full items-center justify-between gap-[3cqw] px-[6cqw]">
      <div className="min-w-0 flex-1">
        <p className="font-black leading-tight tracking-[-0.04em]" style={{ color: "#3b2399", fontSize: "clamp(15px, 3.3cqw, 48px)" }}>
          인플루언서 협업 광고 신청하기
        </p>
        <p className="mt-[1cqw] hidden leading-snug sm:block" style={{ color: "#5d4b9c", fontSize: "clamp(12px, 1.6cqw, 22px)" }}>
          우리 상품을 인플루언서 콘텐츠로 소개해 보세요. 샘플 제공으로 영상 1건 또는 라이브 홍보 1회를 진행할 수 있어요.
        </p>
        <p className="mt-[0.8cqw] font-bold leading-snug" style={{ color: "#4a2fb0", fontSize: "clamp(10.5px, 1.45cqw, 20px)" }}>
          기본 콘텐츠 홍보 운영비 30,000원부터 · 샘플 제공 필수
        </p>
      </div>
      <span
        className="shrink-0 whitespace-nowrap rounded-full font-bold text-white"
        style={{ background: url ? "#5b3fc4" : "#a79bd6", fontSize: "clamp(11px, 1.6cqw, 22px)", padding: "clamp(6px, 1cqw, 14px) clamp(12px, 2.4cqw, 34px)" }}
      >
        {url ? "콘텐츠 홍보 신청하기" : "신청하기 (미리보기)"}
      </span>
    </div>
  );
  const cls = `absolute inset-0 transition-opacity duration-700 ${active ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`;
  const style = { background: "linear-gradient(120deg,#f1ecff 0%,#d9cffa 100%)", containerType: "inline-size" as const };
  return url ? (
    <a href={url} target="_blank" rel="noopener" aria-hidden={!active} tabIndex={active ? 0 : -1} aria-label="인플루언서 협업 광고 신청하기 (인플09로 이동)" className={cls} style={style}>
      {inner}
    </a>
  ) : (
    <div aria-hidden={!active} className={cls} style={style}>
      {inner}
    </div>
  );
}

export function Hero({ infl09 }: { infl09?: { url: string | null; preview: boolean } }) {
  const showInfl = Boolean(infl09 && (infl09.url || infl09.preview));
  const total = banners.length + (showInfl ? 1 : 0);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setCurrent((index) => (index + 1) % total);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [paused, total]);

  return (
    <section
      aria-label="더홍보 소개"
      aria-roledescription="캐러셀"
      className="overflow-hidden bg-[#f3f8fd]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="relative mx-auto aspect-[2172/724] max-w-[1440px]">
        {showInfl && <Infl09Slide url={infl09!.url} active={current === 0} />}
        {banners.map((banner, i) => {
          const index = i + (showInfl ? 1 : 0);
          const active = index === current;

          return (
            <Link
              key={banner.src}
              href="/write"
              aria-label={`${banner.alt} 지금 홍보 작성하기`}
              aria-hidden={!active}
              tabIndex={active ? 0 : -1}
              className={`absolute inset-0 transition-opacity duration-700 focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-brand ${
                active ? "z-10 opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <Image
                src={banner.src}
                alt={active ? banner.alt : ""}
                width={2172}
                height={724}
                priority={i === 0 && !showInfl}
                className="block h-auto w-full"
              />
            </Link>
          );
        })}

        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-white/75 px-3 py-2 shadow-sm backdrop-blur-sm sm:bottom-4">
          {Array.from({ length: total }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${index + 1}번 배너 보기`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => setCurrent(index)}
              className={`size-2.5 rounded-full transition-colors sm:size-3 ${
                index === current ? "bg-brand" : "bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
