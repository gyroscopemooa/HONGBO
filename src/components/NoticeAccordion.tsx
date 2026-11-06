"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { NOTICE_KINDS, parseNoticeTitle, type NoticeKind } from "@/lib/notice";
import type { Notice } from "@/lib/types";
import { cn, formatDate, isWithinWeek } from "@/lib/utils";

const KIND_STYLE: Record<NoticeKind, string> = {
  공지: "bg-brand-soft text-brand-dark",
  업데이트: "bg-[#e6f6ef] text-[#0e7a63]",
  기타: "bg-[#eef0f4] text-muted",
};

/** 구분별로 걸러 보고, 제목을 눌러 내용을 열고 접는 공지 목록 */
export function NoticeAccordion({ notices }: { notices: Notice[] }) {
  const [kind, setKind] = useState<NoticeKind | "전체">("전체");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const m = window.location.hash.match(/^#n-(\d+)$/);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 해시 앵커로 공지 열기(마운트 후에만 접근 가능)
    if (m) setOpen(Number(m[1]));
  }, []);

  const items = notices.map((n) => ({ n, ...parseNoticeTitle(n.title) })).filter((x) => kind === "전체" || x.kind === kind);

  return (
    <div className="not-prose">
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="공지 구분">
        {(["전체", ...NOTICE_KINDS] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={cn("rounded-full border px-3.5 py-1.5 text-sm font-bold transition", kind === k ? "border-brand bg-brand text-white" : "border-line bg-white text-muted hover:border-brand-line")}
          >
            {k}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">이 구분의 글이 없어요.</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {items.map(({ n, kind: k, title }) => {
            const isOpen = open === n.id;
            const recent = isWithinWeek(n.publishedAt);
            return (
              <li key={n.id} id={`n-${n.id}`} className="scroll-mt-28">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : n.id)}
                  className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left"
                >
                  <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11.5px] font-extrabold", KIND_STYLE[k])}>{k}</span>
                  {n.isPinned && <span className="shrink-0 text-[11.5px] font-bold text-brand">상단</span>}
                  <span className="min-w-0 flex-1 break-words text-[15px] font-bold text-ink">{title}</span>
                  {recent && (
                    <time dateTime={n.publishedAt} className="shrink-0 text-xs text-faint">
                      {formatDate(n.publishedAt)}
                    </time>
                  )}
                  <ChevronDown size={18} aria-hidden className={cn("shrink-0 text-faint transition", isOpen && "rotate-180")} />
                </button>
                {isOpen && <p className="whitespace-pre-wrap px-4 pb-5 text-[14.5px] leading-7 text-ink-2">{n.body || "내용이 없어요."}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
