"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Flame, Clock, MapPin } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

function NavInner() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const sort = sp.get("sort");

  const activeCat = pathname.startsWith("/category/")
    ? pathname.split("/")[2]
    : pathname === "/" || (pathname === "/posts" && !sort)
      ? "all"
      : null;

  const linkCls = (active: boolean) =>
    cn(
      "relative inline-flex h-12 shrink-0 items-center gap-1.5 px-3 text-[14.5px] font-semibold transition-colors sm:px-3.5",
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
        <span className="mx-1 h-4 w-px shrink-0 bg-line lg:hidden" aria-hidden />
        <div className="flex items-center lg:hidden">
          <Link href="/posts?sort=popular" className={linkCls(sort === "popular")}>인기글</Link>
          <Link href="/posts?sort=latest" className={linkCls(sort === "latest")}>최신글</Link>
          <Link href="/region" className={linkCls(pathname === "/region")}>지역별</Link>
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-1 border-l border-line pl-3 lg:flex">
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
