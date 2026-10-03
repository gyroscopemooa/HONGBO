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

export function Hero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setCurrent((index) => (index + 1) % banners.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [paused]);

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
        {banners.map((banner, index) => {
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
                priority={index === 0}
                className="block h-auto w-full"
              />
            </Link>
          );
        })}

        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-white/75 px-3 py-2 shadow-sm backdrop-blur-sm sm:bottom-4">
          {banners.map((banner, index) => (
            <button
              key={banner.src}
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
