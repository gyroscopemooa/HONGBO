"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** 쿠폰 코드를 보여주고 한 번에 복사합니다. */
export function CopyCodeButton({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = code;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        window.setTimeout(() => setDone(false), 1800);
      }}
      className="mt-2 flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-[#d98e04] bg-white px-3 py-2.5 text-left"
      aria-label={`쿠폰 코드 ${code} 복사`}
    >
      <span className="min-w-0 break-all font-mono text-[16px] font-extrabold tracking-wide text-ink">{code}</span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-[#8a5a0a]">
        {done ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
        {done ? "복사됐어요" : "복사"}
      </span>
    </button>
  );
}
