"use client";

import { useEffect, useRef } from "react";
import { LENS, spring, step, tuned } from "@/lib/spring";
import "./glass-lens.css";

/**
 * Glass Lens — 사진 위에 마우스를 올리면 둥근 유리 돋보기가 스프링으로 따라다니며 사진을 확대해요.
 * 누르고 있으면 더 크게 확대돼요. 마우스가 없는 기기(터치)와 "동작 줄이기" 설정에서는 출렁임 없이 부드럽게만 움직입니다.
 *
 * 쓰는 법: 사진이 들어 있는 `relative overflow-hidden` 상자 안에 <GlassLens src={사진 주소} /> 를 넣으면 돼요.
 * 렌즈는 바로 위 상자(부모)에 마우스를 올렸을 때만 나타나고, 글자·배지(z-10)는 렌즈 위에 그대로 보여요.
 */
export function GlassLens({ src, size = LENS.size }: { src: string; size?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const copies = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const host = root.current?.parentElement;
    const lensEl = lens.current;
    const viewEl = view.current;
    if (!host || !lensEl || !viewEl || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const X = tuned(spring(0, ...LENS.follow), reduce);
    const Y = tuned(spring(0, ...LENS.follow), reduce);
    const Z = tuned(spring(LENS.zoom, ...LENS.zoomSpring), reduce);
    const A = tuned(spring(0, ...LENS.fade), reduce);
    const L = size;
    lensEl.style.width = lensEl.style.height = `${L}px`;

    let inside = false;
    let raf = 0;
    let last = 0;
    let armed = false;

    const render = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      const x = X.x;
      const y = Y.x;
      const a = Math.max(0, Math.min(1, A.x));
      // 손에 든 돋보기처럼 움직이는 쪽으로 살짝 기울어요(찌그러지지 않음)
      const tilt = Math.max(-6, Math.min(6, X.v / 220));
      lensEl.style.opacity = a.toFixed(3);
      lensEl.style.transform = `translate(${(x - L / 2).toFixed(2)}px,${(y - L / 2).toFixed(2)}px) rotate(${tilt.toFixed(2)}deg) scale(${(0.82 + 0.18 * a).toFixed(3)})`;
      // 세 겹의 사진을 실제 사진 위치에 맞춘 뒤 렌즈 중심을 기준으로 확대
      const ox = -(x - L / 2);
      const oy = -(y - L / 2);
      copies.current.forEach((c, i) => {
        if (!c) return;
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
        c.style.transformOrigin = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
        c.style.transform = `translate(${ox.toFixed(2)}px,${oy.toFixed(2)}px) scale(${(Z.x * LENS.bend[i]).toFixed(4)})`;
      });
      viewEl.style.transform = `rotate(${(-tilt).toFixed(2)}deg)`;
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      for (let k = 0; k < 4; k++) {
        step(X, dt / 4);
        step(Y, dt / 4);
        step(Z, dt / 4);
        step(A, dt / 4);
      }
      render();
      if (inside || A.x > 0.01 || Math.abs(A.v) > 0.01) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        A.x = 0;
        lensEl.style.opacity = "0";
      }
    };
    const run = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const local = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };

    const arm = () => {
      // 사진은 처음 마우스를 올릴 때 한 번만 불러와요
      if (armed) return;
      armed = true;
      copies.current.forEach((c) => {
        if (c) c.style.backgroundImage = `url(${JSON.stringify(src)})`;
      });
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      arm();
      const [x, y] = local(e);
      if (A.x < 0.02) {
        X.x = X.t = x;
        Y.x = Y.t = y;
      }
      X.t = x;
      Y.t = y;
      inside = true;
      A.t = 1;
      run();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!inside) return onEnter(e);
      [X.t, Y.t] = local(e);
    };
    const onLeave = () => {
      inside = false;
      A.t = 0;
      Z.t = LENS.zoom;
      run();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && inside) Z.t = LENS.press;
    };
    const onUp = () => {
      Z.t = LENS.zoom;
    };

    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [src, size]);

  return (
    <div ref={root} className="gl-root" aria-hidden>
      <div ref={lens} className="gl-lens">
        <div ref={view} className="gl-view">
          {LENS.bend.map((_, i) => (
            <div key={i} className={`gl-layer gl-l${i}`}>
              <div ref={(el) => { copies.current[i] = el; }} className="gl-copy" />
            </div>
          ))}
        </div>
        <div className="gl-glass" />
      </div>
    </div>
  );
}
