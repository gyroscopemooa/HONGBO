"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronDown, Flame, Clock, MapPin } from "lucide-react";
import { BENEFITS, CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

/** 커뮤니티 · 홍보소모임을 하나로 묶은 드롭다운 (데스크톱) */
function CommunityMenu({ pathname, items, linkCls }: { pathname: string; items: Array<[string, string]>; linkCls: (active: boolean) => string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = items.some(([href]) => pathname.startsWith(href));

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(true)} className={linkCls(active)}>
        커뮤니티
        <ChevronDown size={14} aria-hidden className={cn("transition-transform", open && "rotate-180")} />
        {active && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-brand" aria-hidden />}
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 min-w-[150px] rounded-xl border border-line bg-white p-1.5 shadow-pop">
          {items.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              className={cn("block rounded-lg px-3 py-2 text-[14px] font-semibold hover:bg-soft", pathname.startsWith(href) ? "text-brand" : "text-ink-2")}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NavInner() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const sort = sp.get("sort");

  const activeCat = pathname.startsWith("/category/")
    ? pathname.split("/")[2]
    : pathname === "/" || (pathname === "/posts" && !sort)
      ? "all"
      : null;

  const extra: Array<[string, string]> = [
    ["/community", "커뮤니티"],
    ["/meetup", "홍보소모임"],
  ];
  const linkCls = (active: boolean) =>
    cn(
      "relative inline-flex h-12 shrink-0 items-center gap-1.5 px-2.5 text-[14.5px] font-semibold transition-colors sm:px-3",
      active ? "text-brand" : "text-ink-2 hover:text-brand",
    );
  const underline = (active: boolean) =>
    active ? <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-brand" aria-hidden /> : null;

  return (
    <nav aria-label="카테고리" className="wrap flex items-center">
      <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 items-center overflow-x-auto">
        <Link href="/posts" className={linkCls(activeCat === "all")} aria-current={activeCat === "all" ? "page" : undefined}>
          <CategoryIcon slug="all" size={17} />
          전체보기
          {underline(activeCat === "all")}
        </Link>
        {CATEGORIES.map((c) => {
          const active = activeCat === c.slug;
          return (
            <Link key={c.slug} href={`/category/${c.slug}`} className={linkCls(active)} aria-current={active ? "page" : undefined}>
              {c.name}
              {underline(active)}
            </Link>
          );
        })}
        <span className="mx-1 h-4 w-px shrink-0 bg-line" aria-hidden />
        {BENEFITS.map((b) => {
          const active = pathname === `/benefit/${b.value}`;
          return (
            <Link key={b.value} href={`/benefit/${b.value}`} className={linkCls(active)} aria-current={active ? "page" : undefined}>
              {b.label}
              {underline(active)}
            </Link>
          );
        })}
        <div className="flex items-center xl:hidden">
          {extra.map(([href, label]) => (
            <Link key={href} href={href} className={linkCls(pathname.startsWith(href))} aria-current={pathname.startsWith(href) ? "page" : undefined}>
              {label}
              {underline(pathname.startsWith(href))}
            </Link>
          ))}
          <span className="mx-1 h-4 w-px shrink-0 bg-line" aria-hidden />
          <Link href="/posts?sort=popular" className={linkCls(sort === "popular")}>인기글</Link>
          <Link href="/posts?sort=latest" className={linkCls(sort === "latest")}>최신글</Link>
          <Link href="/region" className={linkCls(pathname === "/region")}>지역별</Link>
        </div>
      </div>
      <div className="hidden shrink-0 items-center border-l border-line pl-2 xl:flex">
        <CommunityMenu pathname={pathname} items={extra} linkCls={linkCls} />
        <span className="mx-1 h-4 w-px shrink-0 bg-line" aria-hidden />
        <Link href="/posts?sort=popular" className={linkCls(sort === "popular")}>
          <Flame size={15} aria-hidden /> 인기글
        </Link>
        <Link href="/posts?sort=latest" className={linkCls(sort === "latest")}>
          <Clock size={15} aria-hidden /> 최신글
        </Link>
        <Link href="/region" className={linkCls(pathname === "/region")}>
          <MapPin size={15} aria-hidden /> 지역별
        </Link>
      </div>
    </nav>
  );
}

export function CategoryNav() {
  return (
    <div className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <Suspense fallback={<div className="h-12" />}>
        <NavInner />
      </Suspense>
    </div>
  );
}
