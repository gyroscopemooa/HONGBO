import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Notice } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function NoticeList({ notices }: { notices: Notice[] }) {
  if (notices.length === 0) return null;
  return (
    <section aria-label="공지사항" className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold tracking-[-0.03em]">공지사항</h2>
        <Link href="/notices" className="inline-flex items-center text-[13px] text-muted hover:text-brand">
          더보기 <ChevronRight size={14} aria-hidden />
        </Link>
      </div>
      <ul className="divide-y divide-line/70">
        {notices.map((n) => (
          <li key={n.id}>
            <Link href={`/notices#n-${n.id}`} className="group flex items-center justify-between gap-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-[13.5px] text-ink-2 group-hover:text-brand-dark">
                <span className="size-1 shrink-0 rounded-full bg-faint" aria-hidden />
                <span className="truncate">{n.title}</span>
              </span>
              <time dateTime={n.publishedAt} className="shrink-0 text-[12px] text-faint">
                {formatDate(n.publishedAt)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
