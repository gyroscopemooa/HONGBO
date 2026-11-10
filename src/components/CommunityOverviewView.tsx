"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Section = { title: string; href: string; tint: string; color: string; items: {title: string; href: string}[]; failed: boolean };
export function CommunityOverviewView({ initial }: { initial: Section[] }) {
  const [sections, setSections] = useState(initial);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/community-overview", { cache: "no-store", signal: controller.signal });
        if (response.ok) setSections(await response.json());
      } catch { /* Preserve the last successful response. */ }
    }, 60000);
    return () => { clearInterval(timer); controller.abort(); };
  }, []);
  return <aside aria-label="커뮤니티 모아보기" className="p-3">
    <h2 className="px-1 pb-3 pt-1 text-sm font-extrabold">커뮤니티 모아보기</h2>
    <div className="space-y-2">{sections.map(section => <section key={section.href} className="rounded-lg p-3" style={{ backgroundColor: section.tint }}>
      <Link href={section.href} className="flex items-center justify-between text-xs font-bold" style={{color: section.color}}><h3>{section.title}</h3><span aria-label="전체보기">더보기 ›</span></Link>
      {section.items.length ? <ul className="mt-1">{section.items.map(item => <li key={item.href}><Link href={item.href} className="block truncate py-2 text-[13px] text-ink-2 hover:underline">{item.title}</Link></li>)}</ul> : <p className="mt-2 text-xs text-muted">{section.failed ? "잠시 불러오지 못했어요." : "아직 올라온 글이 없어요."}</p>}
    </section>)}</div>
  </aside>;
}
