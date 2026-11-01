"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** 내 사이트·블로그·프로필에 붙이는 "더홍보에 등록됨" 배지와 복사용 코드 */
export function BadgeKit({ postId, origin }: { postId: number; origin: string }) {
  const [dark, setDark] = useState(false);
  const [copied, setCopied] = useState<"html" | "md" | null>(null);
  const post = `${origin}/post/${postId}`;
  const img = `${origin}/badge${dark ? "-dark" : ""}.svg`;
  const html = `<a href="${post}" target="_blank" rel="noopener"><img src="${img}" alt="더홍보에 등록됨" width="168" height="40"></a>`;
  const md = `[![더홍보에 등록됨](${img})](${post})`;

  const copy = async (kind: "html" | "md") => {
    try {
      await navigator.clipboard.writeText(kind === "html" ? html : md);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  return (
    <details className="group mt-3 rounded-xl border border-line bg-white p-3">
      <summary className="cursor-pointer list-none text-[13px] font-semibold text-ink-2 marker:hidden">
        내 사이트에 &lsquo;더홍보 등록됨&rsquo; 배지 달기 <span className="text-faint group-open:hidden">▾</span>
        <span className="hidden text-faint group-open:inline">▴</span>
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-[12.5px] leading-relaxed text-muted">블로그, 사이트, 인스타 소개란에 붙이면 방문자가 배지를 눌러 이 홍보글로 올 수 있어요.</p>
        <div className="flex gap-1.5">
          {[
            ["밝은 배지", false],
            ["어두운 배지", true],
          ].map(([label, value]) => (
            <button
              key={String(label)}
              type="button"
              aria-pressed={dark === value}
              onClick={() => setDark(value as boolean)}
              className={cn("h-8 rounded-full border px-3 text-[12.5px] font-semibold", dark === value ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2")}
            >
              {label as string}
            </button>
          ))}
        </div>
        <div className={cn("flex justify-center rounded-lg border border-line p-3", dark ? "bg-[#f1f2f5]" : "bg-soft")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/badge${dark ? "-dark" : ""}.svg`} alt="더홍보에 등록됨 배지 미리보기" width={168} height={40} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => copy("html")} className="btn btn-outline btn-sm">
            {copied === "html" ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} HTML 복사
          </button>
          <button type="button" onClick={() => copy("md")} className="btn btn-outline btn-sm">
            {copied === "md" ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} 마크다운 복사
          </button>
        </div>
      </div>
    </details>
  );
}
