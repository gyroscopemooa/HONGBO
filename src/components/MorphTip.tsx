"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Morph tooltip — 메뉴 위를 옮겨 다닐 때 말풍선 하나가 위치·크기·글자를 스프링으로 이어서 변한다.
 * 스프링 값은 designbookmark 토큰과 동일: follow(위치) 900/50, settle(크기) 280/22.
 * 사용법: 감싼 영역 안의 요소에 data-tip="설명" (선택: data-tip-side="right") 를 붙인다.
 */
const FOLLOW = { k: 900, c: 50 };
const SETTLE = { k: 280, c: 22 };

type Spring = { x: number; v: number; t: number };
const mk = (x = 0): Spring => ({ x, v: 0, t: x });
function step(s: Spring, p: { k: number; c: number }, dt: number, reduced: boolean) {
  if (reduced) {
    s.x = s.t;
    s.v = 0;
    return;
  }
  const a = -p.k * (s.x - s.t) - p.c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}

export function MorphTip({ children, className }: { children: ReactNode; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const tip = tipRef.current;
    const text = textRef.current;
    if (!host || !tip || !text) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const sx = mk(), sy = mk(), sw = mk(), sh = mk();
    let shown = false;
    let raf = 0;
    let last = 0;
    let hideTimer: number | undefined;
    let swapTimer: number | undefined;
    let current: HTMLElement | null = null;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      for (let i = 0; i < 4; i++) {
        step(sx, FOLLOW, dt / 4, reduced);
        step(sy, FOLLOW, dt / 4, reduced);
        step(sw, SETTLE, dt / 4, reduced);
        step(sh, SETTLE, dt / 4, reduced);
      }
      tip.style.transform = `translate3d(${sx.x}px, ${sy.x}px, 0)`;
      tip.style.width = `${Math.max(sw.x, 0)}px`;
      tip.style.height = `${Math.max(sh.x, 0)}px`;
      const moving = [sx, sy, sw, sh].some((s) => Math.abs(s.x - s.t) > 0.1 || Math.abs(s.v) > 0.1);
      if (moving) raf = requestAnimationFrame(frame);
      else raf = 0;
    };
    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const measure = (label: string) => {
      // 보이지 않는 측정용 복제본으로 글자 크기를 잰다
      const probe = tip.cloneNode(true) as HTMLElement;
      probe.style.cssText = "position:fixed;left:-9999px;top:0;width:auto;height:auto;max-width:240px;opacity:0;transition:none";
      (probe.querySelector("[data-tip-text]") as HTMLElement).textContent = label;
      document.body.appendChild(probe);
      const r = probe.getBoundingClientRect();
      probe.remove();
      return { w: Math.ceil(r.width), h: Math.ceil(r.height) };
    };

    const show = (el: HTMLElement) => {
      const label = el.dataset.tip;
      if (!label || el === current) return;
      current = el;
      window.clearTimeout(hideTimer);
      const { w, h } = measure(label);
      const r = el.getBoundingClientRect();
      const side = el.dataset.tipSide === "right" ? "right" : "bottom";
      let x = side === "right" ? r.right + 8 : r.left + r.width / 2 - w / 2;
      const y = side === "right" ? r.top + r.height / 2 - h / 2 : r.bottom + 8;
      x = Math.max(8, Math.min(x, window.innerWidth - w - 8));
      sw.t = w;
      sh.t = h;
      sx.t = x;
      sy.t = y;
      if (!shown) {
        // 처음 나타날 때는 제자리에서 펼쳐진다
        sx.x = x;
        sy.x = y + (side === "bottom" ? -6 : 0);
        sw.x = w * 0.6;
        sh.x = h * 0.6;
        sx.v = sy.v = sw.v = sh.v = 0;
        shown = true;
        tip.style.opacity = "1";
      }
      // 글자는 잠깐 사라졌다가 새 문구로 바뀐다
      window.clearTimeout(swapTimer);
      if (text.textContent && text.textContent !== label && !reduced) {
        text.style.opacity = "0";
        swapTimer = window.setTimeout(() => {
          text.textContent = label;
          text.style.opacity = "1";
        }, 90);
      } else {
        text.textContent = label;
        text.style.opacity = "1";
      }
      kick();
    };
    const hide = () => {
      current = null;
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        shown = false;
        tip.style.opacity = "0";
      }, 120);
    };

    const find = (t: EventTarget | null) => (t instanceof Element ? (t.closest("[data-tip]") as HTMLElement | null) : null);
    const over = (e: Event) => {
      const el = find(e.target);
      if (el) show(el);
    };
    const out = (e: Event) => {
      const el = find(e.target);
      const to = find((e as MouseEvent).relatedTarget);
      if (el && !to) hide();
    };
    host.addEventListener("pointerover", over);
    host.addEventListener("pointerout", out);
    host.addEventListener("focusin", over);
    host.addEventListener("focusout", out);
    host.addEventListener("click", hide);
    window.addEventListener("scroll", hide, true);
    return () => {
      host.removeEventListener("pointerover", over);
      host.removeEventListener("pointerout", out);
      host.removeEventListener("focusin", over);
      host.removeEventListener("focusout", out);
      host.removeEventListener("click", hide);
      window.removeEventListener("scroll", hide, true);
      cancelAnimationFrame(raf);
      window.clearTimeout(hideTimer);
      window.clearTimeout(swapTimer);
    };
  }, []);

  return (
    <>
      <div ref={hostRef} className={className}>
        {children}
      </div>
      <div
        ref={tipRef}
        role="presentation"
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] hidden overflow-hidden rounded-xl bg-ink px-3 py-2 text-[12.5px] font-semibold leading-snug text-white opacity-0 transition-opacity duration-150 xl:block"
        style={{ boxSizing: "border-box", maxWidth: 240 }}
      >
        <span data-tip-text ref={textRef} className="block whitespace-normal transition-opacity duration-100" />
      </div>
    </>
  );
}
