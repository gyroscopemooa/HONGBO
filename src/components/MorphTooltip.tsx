"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * 모프 툴팁 — 디자인북마크 "Morph tooltip" 을 React 로 옮긴 것입니다.
 * 툴팁은 하나뿐이고, 항목 사이를 옮겨 다닐 때 사라지지 않고 늘어나며 다음 항목의 너비로 맞춰집니다.
 * 스프링 값(강성·감쇠)은 원본 tokens.css 와 동일합니다.
 */
type Spring = { x: number; v: number; t: number; k: number; c: number };
const S = (x: number, k = 400, c = 30): Spring => ({ x, v: 0, t: x, k, c });
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const LEAD: [number, number] = [620, 36]; // --spring-lead
const TRAIL: [number, number] = [190, 19]; // --spring-trail
const TAIL: [number, number] = [300, 22];
const SHOW: [number, number] = [420, 24];
const FADE: [number, number] = [420, 32]; // --spring-fade

type Engine = {
  reduce: boolean;
  TL: Spring; TR: Spring; TX: Spring; A: Spring;
  labs: { o: Spring; dir: number; w: number }[];
  cur: number;
  hide: number | null;
  raf: number | null;
  last: number;
};

function tune(s: Spring, k: number, c: number, reduce: boolean) {
  s.k = k;
  s.c = reduce ? 2 * Math.sqrt(k) : c;
}
function step(s: Spring, dt: number) {
  const a = -s.k * (s.x - s.t) - s.c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}
const settled = (s: Spring) => Math.abs(s.x - s.t) < 0.01 && Math.abs(s.v) < 0.01;

/**
 * anchors: 항목(점)들을 감싼 relative 영역 안에서 각 항목 요소를 돌려주는 함수
 * 툴팁은 anchors 영역의 위쪽에 뜹니다.
 */
export function MorphTooltip({
  labels,
  getAnchor,
  active,
  className,
}: {
  labels: string[];
  getAnchor: (i: number) => HTMLElement | null;
  /** 지금 툴팁을 가리킬 항목 번호(없으면 -1). 부모가 hover/focus 로 정합니다. */
  active: number;
  className?: string;
}) {
  const tipRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLSpanElement>(null);
  const labRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const eng = useRef<Engine | null>(null);

  if (!eng.current) {
    eng.current = {
      reduce: false,
      TL: S(0, ...LEAD), TR: S(0, ...LEAD), TX: S(0, ...TAIL), A: S(0, ...SHOW),
      labs: [], cur: -1, hide: null, raf: null, last: 0,
    };
  }

  const centerOf = useCallback(
    (i: number) => {
      const el = getAnchor(i);
      return el ? el.offsetLeft + el.offsetWidth / 2 : 0;
    },
    [getAnchor],
  );

  const render = useCallback(() => {
    const e = eng.current!;
    const tip = tipRef.current, tail = tailRef.current;
    if (!tip || !tail) return;
    const a = clamp(e.A.x, 0, 1.15), op = clamp(e.A.x, 0, 1);
    const l0 = Math.min(e.TL.x, e.TR.x - 30), w = e.TR.x - l0;
    // 화면 밖으로 나가지 않게: 부모의 화면 좌표 기준으로 좌우 8px 여백 안에 가둡니다.
    const parent = tip.parentElement!.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const l = clamp(l0, 8 - parent.left, Math.max(8 - parent.left, vw - 8 - parent.left - w));
    tip.style.width = `${w.toFixed(2)}px`;
    tip.style.opacity = op.toFixed(3);
    tip.style.transform = `translate(${l.toFixed(2)}px,${((1 - a) * 6).toFixed(2)}px) scale(${(0.72 + 0.28 * a).toFixed(4)})`;
    const tx = clamp(e.TX.x, l + 12, l + w - 12);
    tail.style.opacity = op.toFixed(3);
    tail.style.transform = `translate(${(tx - 5).toFixed(2)}px,${((1 - a) * 8).toFixed(2)}px) rotate(45deg) scale(${a.toFixed(3)})`;
    e.labs.forEach((lb, k) => {
      const el = labRefs.current[k];
      if (!el) return;
      const o = clamp(lb.o.x, 0, 1);
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translateX(calc(-50% + ${(lb.dir * (1 - o) * 14).toFixed(2)}px))`;
      el.style.filter = o > 0.02 && o < 0.98 ? `blur(${((1 - o) * 3).toFixed(2)}px)` : "none";
    });
  }, []);

  const run = useCallback(() => {
    const e = eng.current!;
    if (e.raf != null) return;
    e.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - e.last) / 1000, 1 / 30);
      e.last = now;
      // 점 위치(활성 점은 폭이 변함)를 따라가도록 목표를 매 프레임 갱신
      if (e.cur > -1) {
        const c = centerOf(e.cur), half = e.labs[e.cur].w / 2;
        e.TL.t = c - half; e.TR.t = c + half; e.TX.t = c;
      }
      for (let k = 0; k < 4; k++) {
        [e.TL, e.TR, e.TX, e.A].forEach((s) => step(s, dt / 4));
        e.labs.forEach((l) => step(l.o, dt / 4));
      }
      render();
      const idle = [e.TL, e.TR, e.TX, e.A, ...e.labs.map((l) => l.o)].every(settled) && e.cur === -1;
      if (idle) { e.raf = null; return; }
      e.raf = requestAnimationFrame(loop);
    };
    e.raf = requestAnimationFrame(loop);
  }, [centerOf, render]);

  const measure = useCallback(() => {
    const e = eng.current!;
    e.labs = labels.map((_, i) => ({ o: e.labs[i]?.o ?? S(0, ...FADE), dir: e.labs[i]?.dir ?? 0, w: labRefs.current[i]?.offsetWidth || e.labs[i]?.w || 96 }));
  }, [labels]);

  useEffect(() => {
    const e = eng.current!;
    e.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    measure();
    if (document.fonts?.ready) document.fonts.ready.then(() => { measure(); run(); });
    return () => { if (e.raf != null) cancelAnimationFrame(e.raf); e.raf = null; if (e.hide) window.clearTimeout(e.hide); };
  }, [measure, run]);

  // 부모가 정한 항목으로 이동
  useEffect(() => {
    const e = eng.current!;
    measure();
    if (active < 0) {
      if (e.hide) window.clearTimeout(e.hide);
      // 항목 사이를 지나갈 때 깜빡이지 않도록 잠깐 기다렸다가 숨깁니다.
      e.hide = window.setTimeout(() => { e.hide = null; e.A.t = 0; e.cur = -1; run(); }, 140);
      return;
    }
    if (e.hide) { window.clearTimeout(e.hide); e.hide = null; }
    if (active === e.cur) { e.A.t = 1; run(); return; }
    const dir = e.cur < 0 ? 0 : Math.sign(active - e.cur);
    const c = centerOf(active), half = (e.labs[active]?.w ?? 96) / 2;
    if (e.A.x < 0.3) {
      // 아직 아무것도 안 보이면 필요한 자리에서 바로 나타남
      [[e.TL, c - half], [e.TR, c + half], [e.TX, c]].forEach(([s, v]) => { const sp = s as Spring; sp.t = sp.x = v as number; sp.v = 0; });
      e.labs.forEach((l, k) => { l.o.x = l.o.t = k === active ? 1 : 0; l.o.v = 0; l.dir = 0; });
    } else {
      const right = dir >= 0;
      tune(e.TR, ...(right ? LEAD : TRAIL), e.reduce);
      tune(e.TL, ...(right ? TRAIL : LEAD), e.reduce);
      e.TL.t = c - half; e.TR.t = c + half; e.TX.t = c;
      e.labs.forEach((l, k) => {
        if (k === active) { l.dir = dir; l.o.t = 1; }
        else if (l.o.t === 1) { l.dir = -dir; l.o.t = 0; }
      });
    }
    e.cur = active;
    e.A.t = 1;
    tune(e.A, ...SHOW, e.reduce);
    tune(e.TX, ...TAIL, e.reduce);
    e.labs.forEach((l) => tune(l.o, ...FADE, e.reduce));
    run();
  }, [active, centerOf, measure, run]);

  return (
    <div aria-hidden className={className} style={{ position: "absolute", left: 0, bottom: "100%", width: 0, height: 0, pointerEvents: "none" }}>
      <span
        ref={tailRef}
        style={{ position: "absolute", left: 0, bottom: 5, width: 10, height: 10, borderRadius: 3, background: "var(--color-ink)", opacity: 0, willChange: "transform,opacity" }}
      />
      <div
        ref={tipRef}
        role="tooltip"
        style={{
          position: "absolute", left: 0, bottom: 10, height: 32, borderRadius: 12, overflow: "hidden",
          background: "var(--color-ink)", color: "#fff", opacity: 0, transformOrigin: "50% 140%", willChange: "transform,width,opacity",
        }}
      >
        {labels.map((t, i) => (
          <span
            key={i}
            ref={(el) => { labRefs.current[i] = el; }}
            style={{
              position: "absolute", left: "50%", top: 0, height: 32, display: "flex", alignItems: "center", padding: "0 14px",
              whiteSpace: "nowrap", fontSize: 12.5, fontWeight: 700, letterSpacing: "-0.01em", maxWidth: 240, opacity: 0, willChange: "transform,opacity",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{t}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
