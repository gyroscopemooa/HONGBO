"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, MessagesSquare } from "lucide-react";
type LatestData = { items: { id: number; title: string; category: string; createdAt: string }[]; failed: boolean };
export function CommunityLatestView({ limit = 2, title, initial }: { limit?: 2 | 5; title: string; initial: LatestData }) {
  const [data, setData] = useState(initial);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/community-latest", { cache: "no-store", signal: controller.signal });
        if (response.ok) setData(await response.json());
      } catch { /* Keep the last successful list during temporary network errors. */ }
    }, 60000);
    return () => { clearInterval(timer); controller.abort(); };
  }, []);
  const { items, failed } = data;
  return (
    <section aria-label={title} className="flex h-full min-w-0 flex-col rounded-xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold"><MessagesSquare size={18} className="text-indigo-600" aria-hidden />{title}</h2>
        <Link href="/talk" aria-label="회원 커뮤니티 전체보기" className="shrink-0 text-xs text-muted hover:text-brand"><ArrowUpRight size={17} aria-hidden /></Link>
      </div>
      {items.length ? <ul className="mt-2 divide-y divide-line">
        {items.slice(0, limit).map((post) => <li key={post.id} className="min-w-0">
          <Link href={`/talk/${post.id}`} className="group block rounded-lg py-2 hover:bg-white/80">
            <div className="flex min-w-0 items-center gap-3">
              <p className="min-w-0 flex-1 truncate text-[13px] group-hover:text-indigo-600">{post.title}</p>
              <time className="shrink-0 text-[11px] text-muted" dateTime={post.createdAt}>{new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(post.createdAt))}</time>
            </div>
          </Link>
        </li>)}
      </ul> : <p className="flex-1 py-6 text-sm leading-relaxed text-muted">{failed ? "새 이야기를 불러오지 못했어요. 커뮤니티에서 다시 확인해 주세요." : "아직 첫 이야기를 기다리고 있어요. 궁금한 점이나 경험을 나눠주세요."}</p>}

    </section>
  );
}
