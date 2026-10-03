"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${window.location.origin}${path}`;
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = url;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        window.setTimeout(() => setDone(false), 1800);
      }}
      className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-brand"
    >
      {done ? <Check size={14} aria-hidden /> : <Link2 size={14} aria-hidden />}
      {done ? "복사됐어요" : "링크 복사"}
    </button>
  );
}
