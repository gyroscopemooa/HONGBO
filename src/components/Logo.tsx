"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "ko" | "ko-hop" | "en-in" | "en-wave";

const KO = [
  { ch: "더", brand: false },
  { ch: "홍", brand: true },
  { ch: "보", brand: true },
];
const EN = [..."The"].map((ch) => ({ ch, brand: false })).concat([..."Hongbo"].map((ch) => ({ ch, brand: true })));

const VARIANTS: Exclude<Mode, "ko">[] = ["ko-hop", "en-in", "en-wave"];
const ANIM: Record<Mode, string> = {
  ko: "",
  "ko-hop": "hb-logo-hop 0.62s cubic-bezier(.28,.84,.42,1) both",
  "en-in": "hb-logo-in 0.5s cubic-bezier(.2,.9,.3,1.2) both",
  "en-wave": "hb-logo-wave 1.1s ease-in-out both",
};

/** 마우스를 올리면 글자가 통통 튀거나, 영어로 바뀌거나, 영어 글자가 물결치듯 움직입니다. */
export function Logo({ className, size = "md", href = "/" }: { className?: string; size?: "sm" | "md" | "lg"; href?: string | null }) {
  const [mode, setMode] = useState<Mode>("ko");
  const [run, setRun] = useState(0);
  const last = useRef<Mode | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const start = () => {
    if (timer.current) window.clearTimeout(timer.current);
    const pool = VARIANTS.filter((v) => v !== last.current);
    const next = pool[Math.floor(Math.random() * pool.length)];
    last.current = next;
    setMode(next);
    setRun((n) => n + 1);
  };
  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMode("ko"), 700);
  };

  const cls = cn(
    "inline-flex items-baseline font-black leading-none tracking-[-0.06em]",
    size === "lg" ? "text-[40px]" : size === "md" ? "text-[30px]" : "text-[22px]",
    className,
  );
  const letters = mode.startsWith("en") ? EN : KO;
  const inner = (
    <span aria-hidden className="inline-flex items-baseline" key={`${mode}-${run}`}>
      {letters.map((l, i) => (
        <span
          key={i}
          className={cn("hb-logo-letter inline-block", l.brand ? "text-brand" : "text-ink")}
          style={{ animation: ANIM[mode] || undefined, animationDelay: mode === "ko" ? undefined : `${i * (mode === "en-wave" ? 70 : 55)}ms` }}
        >
          {l.ch}
        </span>
      ))}
    </span>
  );
  const handlers = { onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop };
  if (href === null) return <span className={cls} aria-label="더홍보" {...handlers}>{inner}</span>;
  return (
    <Link href={href} className={cls} aria-label="더홍보 홈" {...handlers}>
      {inner}
    </Link>
  );
}
