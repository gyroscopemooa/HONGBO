/**
 * 작은 스프링 엔진 — Glass Lens(designbookmark.com/motion)의 shared/motion.js 와 같은 방식이에요.
 * S: 값·속도·목표·강성(k)·감쇠(c), step: 반 암시적 오일러 한 걸음.
 */
export interface Spring {
  x: number;
  v: number;
  t: number;
  k: number;
  c: number;
}

export const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, t: x, k, c });

export function step(s: Spring, dt: number) {
  const a = -s.k * (s.x - s.t) - s.c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}

/** "동작 줄이기" 설정이면 출렁임 없이 딱 맞게(임계 감쇠) 움직여요. */
export const tuned = (s: Spring, reduce: boolean): Spring => {
  if (reduce) s.c = 2 * Math.sqrt(s.k);
  return s;
};

/** designbookmark.com 의 tokens.css 중 Glass Lens 값 그대로 */
export const LENS = {
  follow: [180, 17] as const, // --lens-follow: 렌즈가 커서를 쫓는 스프링
  zoom: 1.7, // --lens-zoom: 평소 배율
  press: 2.4, // --lens-zoom-press: 누르고 있을 때 배율
  size: 150, // --lens-size: px
  zoomSpring: [260, 26] as const, // lens.js 의 Z 스프링
  fade: [420, 32] as const, // --spring-fade: 나타나고 사라질 때
  bend: [1, 1.05, 1.12] as const, // 가장자리로 갈수록 더 휘는 세 겹
};
