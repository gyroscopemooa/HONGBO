/**
 * 초기 콘텐츠(seed)용 대표 이미지와 카테고리 기본 이미지를 SVG 로 생성합니다.
 * 직접 그린 단순 일러스트이며 외부 에셋/상표/저작권 이미지를 사용하지 않습니다.
 *
 *   npm run seed:images
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SEED_POSTS } from "../src/data/seed";

const W = 640;
const H = 360;

interface Pal {
  bg: [string, string];
  p: string; // primary accent
  s: string; // secondary accent
  t: string; // tertiary accent
  dark: string;
  light: string;
}

const PALETTES: Pal[] = [
  { bg: ["#0f2747", "#245a9a"], p: "#5ec8ff", s: "#ffd166", t: "#ff6b81", dark: "#0a1a30", light: "#ffffff" },
  { bg: ["#fff0e2", "#ffcfae"], p: "#ef6f4b", s: "#7a4b2e", t: "#ffb347", dark: "#5a3320", light: "#ffffff" },
  { bg: ["#e3f8ef", "#b6ead1"], p: "#1fa97a", s: "#ff9f43", t: "#2b6cb0", dark: "#14503c", light: "#ffffff" },
  { bg: ["#2b1b5a", "#6a3fc2"], p: "#b794ff", s: "#ffd166", t: "#ff7aa8", dark: "#1a0f3a", light: "#ffffff" },
  { bg: ["#f6ead7", "#e5cfa8"], p: "#b5763a", s: "#5b7f5b", t: "#d9534f", dark: "#4a3520", light: "#fffaf0" },
  { bg: ["#e1f1ff", "#b6dcff"], p: "#2f80ed", s: "#ff7a59", t: "#1fb58a", dark: "#123a6b", light: "#ffffff" },
  { bg: ["#ffe3ec", "#ffc0d3"], p: "#f0457a", s: "#8e5bd6", t: "#ffb703", dark: "#6b1f3a", light: "#ffffff" },
  { bg: ["#fff8d6", "#ffe58a"], p: "#f2a900", s: "#3a86ff", t: "#ef476f", dark: "#5a4300", light: "#ffffff" },
  { bg: ["#dff3e3", "#a8d8b2"], p: "#2f9e5b", s: "#f4a259", t: "#5b8def", dark: "#17402a", light: "#ffffff" },
  { bg: ["#ffe5e0", "#ffb3a7"], p: "#f04f4a", s: "#2f6fed", t: "#ffc145", dark: "#6e1f1c", light: "#ffffff" },
  { bg: ["#efe8ff", "#cdbdff"], p: "#7c4dff", s: "#ff8fab", t: "#3ec6a8", dark: "#2e1d63", light: "#ffffff" },
  { bg: ["#d9f5f3", "#8fdad4"], p: "#0e9aa7", s: "#ff8c42", t: "#7a5cff", dark: "#0b4a50", light: "#ffffff" },
  { bg: ["#2a2d34", "#4a4f5c"], p: "#ff6b6b", s: "#ffd166", t: "#4dd0e1", dark: "#15171c", light: "#ffffff" },
  { bg: ["#d6ecff", "#7fb8ff"], p: "#1f6feb", s: "#ffb703", t: "#ff5d8f", dark: "#0d2c66", light: "#ffffff" },
  { bg: ["#12261f", "#245a43"], p: "#ffd166", s: "#7be0a3", t: "#ff8e72", dark: "#0b1712", light: "#ffffff" },
];

// ───────── helpers ─────────
const n1 = (n: number) => Math.round(n * 10) / 10;
const rect = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = "") =>
  `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${n1(r)}" fill="${fill}" ${extra}/>`;
const circle = (cx: number, cy: number, r: number, fill: string, extra = "") =>
  `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}" fill="${fill}" ${extra}/>`;
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = "") =>
  `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="${fill}" ${extra}/>`;
const path = (d: string, fill: string, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
const stroke = (d: string, color: string, w: number, extra = "") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const line = (x1: number, y1: number, x2: number, y2: number, color: string, w: number, extra = "") =>
  `<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const g = (inner: string, transform = "", extra = "") => `<g transform="${transform}" ${extra}>${inner}</g>`;
const star4 = (cx: number, cy: number, r: number, fill: string) =>
  path(
    `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`,
    fill,
  );
const heart = (cx: number, cy: number, s: number, fill: string) =>
  path(
    `M${cx} ${cy + s * 0.9}C${cx - s * 1.6} ${cy - s * 0.1} ${cx - s * 0.7} ${cy - s * 1.2} ${cx} ${cy - s * 0.4}C${cx + s * 0.7} ${cy - s * 1.2} ${cx + s * 1.6} ${cy - s * 0.1} ${cx} ${cy + s * 0.9}Z`,
    fill,
  );
const check = (cx: number, cy: number, s: number, color: string, w = 3) =>
  stroke(`M${cx - s} ${cy}L${cx - s * 0.3} ${cy + s * 0.7}L${cx + s} ${cy - s * 0.7}`, color, w);
const lines = (x: number, y: number, widths: number[], gap: number, color: string, h = 5, alpha = 1) =>
  widths
    .map((w, i) => rect(x, y + i * gap, w, h, h / 2, color, alpha < 1 ? `opacity="${alpha}"` : ""))
    .join("");

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function backdrop(P: Pal, seed: number): string {
  const rnd = mulberry32(seed * 7919 + 13);
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += circle(rnd() * W, rnd() * H, 50 + rnd() * 110, "#ffffff", `opacity="${(0.07 + rnd() * 0.1).toFixed(2)}"`);
  }
  // 점 패턴
  const ox = rnd() > 0.5 ? 24 : W - 24 - 70;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) out += circle(ox + c * 14, 28 + r * 14, 2, "#ffffff", 'opacity="0.35"');
  return out;
}

const SHADOW = `<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#000" flood-opacity="0.22"/></filter><filter id="sh2" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.18"/></filter>`;

// 폰: 고정 크기 140x270, 화면 안쪽 좌표는 (-62..62, -127..127)
function phone(P: Pal, x: number, y: number, inner: string, rot = 0, screen = "#ffffff", id = "ph"): string {
  const w = 140;
  const h = 270;
  const pad = 8;
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#sh)">
    ${rect(-w / 2, -h / 2, w, h, 24, P.dark)}
    <clipPath id="${id}">${rect(-w / 2 + pad, -h / 2 + pad, w - 2 * pad, h - 2 * pad, 17, "#000")}</clipPath>
    ${rect(-w / 2 + pad, -h / 2 + pad, w - 2 * pad, h - 2 * pad, 17, screen)}
    <g clip-path="url(#${id})">${inner}</g>
    ${rect(-22, -h / 2 + pad + 4, 44, 9, 4.5, P.dark)}
  </g>`;
}

// 브라우저: 중심 (x,y), 크기 w x h. inner 좌표는 창 왼쪽 위(0,0) 기준, 콘텐츠 시작은 y=34
function browser(P: Pal, x: number, y: number, w: number, h: number, inner: string, rot = 0, id = "br"): string {
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#sh)">
    <g transform="translate(${-w / 2} ${-h / 2})">
      ${rect(0, 0, w, h, 14, "#ffffff")}
      <clipPath id="${id}">${rect(0, 0, w, h, 14, "#000")}</clipPath>
      <g clip-path="url(#${id})">
        ${rect(0, 0, w, 32, 0, "#eef1f6")}
        ${circle(16, 16, 4.5, "#ff6159")}${circle(31, 16, 4.5, "#ffbd2e")}${circle(46, 16, 4.5, "#28c940")}
        ${rect(66, 8, w - 90, 16, 8, "#ffffff")}
        ${inner}
      </g>
    </g>
  </g>`;
}

const card = (x: number, y: number, w: number, h: number, fill = "#fff", r = 12) =>
  rect(x, y, w, h, r, fill, 'filter="url(#sh2)"');

// ───────── 모티프 ─────────
type Motif = (P: Pal) => string;

const motifs: Record<string, Motif> = {
  "phone-translate": (P) => {
    const screen = `${rect(-70, -130, 140, 260, 0, "#1b2a4a")}
      ${rect(-62, -110, 124, 120, 10, "#2d4573")}
      ${circle(0, -66, 20, P.p, 'opacity="0.55"')}
      ${path("M-38 -10C-38 -34 -20 -42 0 -42C20 -42 38 -34 38 -10Z", P.p, 'opacity="0.55"')}
      ${rect(-50, 20, 100, 24, 8, "#ffffff", 'opacity="0.95"')}
      ${lines(-42, 26, [76, 52], 8, P.dark, 4)}
      ${rect(-44, 52, 88, 18, 7, P.s)}
      ${lines(-36, 57, [60], 8, P.dark, 4)}
      ${rect(-52, 96, 104, 5, 2.5, "#ffffff", 'opacity="0.3"')}${rect(-52, 96, 60, 5, 2.5, P.p)}`;
    return (
      phone(P, 250, 185, screen, -5, "#1b2a4a", "p1") +
      `<g transform="translate(450 175)" filter="url(#sh2)">
        ${circle(0, 0, 62, P.p, 'opacity="0.28"')}
        ${circle(0, 0, 62, "none", `stroke="${P.p}" stroke-width="5"`)}
        ${ellipse(0, 0, 26, 62, "none", `stroke="${P.p}" stroke-width="4"`)}
        ${line(-62, 0, 62, 0, P.p, 4)}${stroke("M-54 -28Q0 -14 54 -28", P.p, 4)}${stroke("M-54 28Q0 14 54 28", P.p, 4)}
      </g>
      ${rect(430, 72, 110, 46, 14, "#ffffff", 'filter="url(#sh2)"')}${lines(444, 86, [76, 46], 12, P.dark, 5, 0.7)}
      ${rect(350, 258, 120, 46, 14, P.s, 'filter="url(#sh2)"')}${lines(364, 272, [86, 56], 12, P.dark, 5, 0.7)}`
    );
  },

  "phone-habit": (P) => {
    const rows = [0, 1, 2, 3]
      .map((i) => {
        const y = -70 + i * 38;
        const done = i < 2;
        return `${rect(-52, y, 104, 30, 9, done ? P.bg[0] : "#f3f4f7")}
          ${circle(-36, y + 15, 9, done ? P.p : "#ffffff", done ? "" : 'stroke="#c9ced8" stroke-width="2"')}
          ${done ? check(-36, y + 15, 4, "#fff", 2.5) : ""}
          ${lines(-20, y + 11, [done ? 54 : 60, 30], 8, P.dark, 4, 0.5)}`;
      })
      .join("");
    const screen = `${rect(-62, -120, 124, 46, 0, P.p)}${lines(-50, -104, [60, 36], 12, "#fff", 6)}${rows}`;
    const days = Array.from({ length: 21 }, (_, i) => {
      const c = i % 7;
      const r = Math.floor(i / 7);
      return circle(380 + c * 22, 250 + r * 22, 7, i < 14 ? (i % 5 === 3 ? P.t : P.p) : "#ffffff", i < 14 ? "" : 'opacity="0.6"');
    }).join("");
    return (
      phone(P, 235, 185, screen, 4, "#fff", "p2") +
      `<g transform="translate(450 140)" filter="url(#sh2)">
        ${circle(0, 0, 56, "#ffffff")}
        ${circle(0, 0, 40, "none", `stroke="${P.bg[1]}" stroke-width="12"`)}
        <circle cx="0" cy="0" r="40" fill="none" stroke="${P.p}" stroke-width="12" stroke-linecap="round" stroke-dasharray="188 251" transform="rotate(-90)"/>
        ${check(0, 2, 12, P.p, 6)}
      </g>${days}`
    );
  },

  "phone-food": (P) => {
    const screen = `${rect(-70, -130, 140, 260, 0, "#25332c")}
      ${rect(-56, -98, 112, 150, 8, "#35493f")}
      ${circle(-18, -30, 18, "#ef4444")}${circle(22, -48, 14, "#f59e0b")}${ellipse(14, -4, 20, 14, "#fef3c7")}${circle(14, -4, 7, "#fbbf24")}
      ${circle(-28, 18, 16, "#4ade80")}${circle(-14, 26, 12, "#22c55e")}${circle(30, 24, 13, "#a3e635")}
      ${path("M-56 -98V-82M-56 -98H-40M56 -98V-82M56 -98H40M-56 52V36M-56 52H-40M56 52V36M56 52H40", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round"')}
      ${circle(0, 96, 18, "#ffffff")}${circle(0, 96, 13, P.p)}`;
    return (
      phone(P, 230, 185, screen, -4, "#25332c", "p3") +
      `<g transform="translate(450 185)" filter="url(#sh)">
        ${circle(0, 0, 82, "#ffffff")}${circle(0, 0, 62, "#f3f6f4")}
        ${circle(-18, -16, 22, "#ef4444")}${circle(-18, -16, 13, "#f87171")}
        ${circle(24, -22, 16, "#4ade80")}${circle(36, -8, 13, "#22c55e")}${circle(18, -6, 11, "#86efac")}
        ${ellipse(2, 24, 28, 18, "#fff7d6")}${circle(2, 24, 9, "#fbbf24")}
      </g>
      ${star4(560, 100, 14, P.s)}${star4(372, 78, 9, P.t)}`
    );
  },

  puzzle: (P) => {
    const colors = [P.p, P.s, P.t, "#ffffff", P.s, P.p, P.t, P.p, "#ffffff"];
    let out = "";
    for (let i = 0; i < 9; i++) {
      const c = i % 3;
      const r = Math.floor(i / 3);
      const x = 188 + c * 90;
      const y = 62 + r * 90;
      out += g(
        rect(0, 0, 84, 84, 14, colors[i]) + circle(84, 42, 11, colors[i]) + circle(42, 84, 11, colors[i]) + circle(0, 42, 11, P.bg[0]),
        `translate(${x} ${y}) rotate(${(i * 37) % 7 - 3} 42 42)`,
        'filter="url(#sh2)"',
      );
    }
    return (
      out +
      g(star4(0, 0, 22, P.s), "translate(120 90)") +
      g(star4(0, 0, 14, P.t), "translate(530 300)") +
      g(rect(0, 0, 70, 70, 14, P.t) + circle(70, 35, 10, P.t) + circle(35, 70, 10, P.t), "translate(76 220) rotate(-18)", 'filter="url(#sh2)"') +
      g(rect(0, 0, 56, 56, 12, P.p) + circle(56, 28, 8, P.p), "translate(520 70) rotate(14)", 'filter="url(#sh2)"')
    );
  },

  "phone-travel": (P) => {
    const bubble = (y: number, own: boolean) =>
      rect(own ? -8 : -54, y, 62, 34, 12, own ? P.p : "#f1f3f6") + lines(own ? 0 : -46, y + 11, [44, 28], 9, own ? "#fff" : P.dark, 4, own ? 1 : 0.5);
    const screen = `${rect(-62, -120, 124, 40, 0, P.s)}${lines(-50, -106, [56, 34], 10, "#fff", 5)}
      ${bubble(-66, false)}${bubble(-24, true)}${bubble(18, false)}${bubble(60, true)}`;
    return (
      phone(P, 240, 185, screen, 5, "#fff", "p5") +
      `<g transform="translate(445 170)">
        <path d="M0 74C-44 22 -52 -6 -52 -22A52 52 0 0 1 52 -22C52 -6 44 22 0 74Z" fill="${P.t}" filter="url(#sh2)"/>
        ${circle(0, -22, 20, "#ffffff")}${circle(0, -22, 9, P.t)}
      </g>
      ${stroke("M330 300Q440 330 560 250", P.dark, 3, 'stroke-dasharray="2 9" opacity="0.5"')}
      ${g(path("M0 0L48 -12L58 -24L66 -22L60 -8L74 -2L70 6L52 4L36 20L28 18L36 2L10 8L2 16L-4 12Z", P.dark, 'opacity="0.85"'), "translate(470 70) rotate(-12)")}
      ${star4(380, 90, 12, P.s)}`
    );
  },

  "browser-resume": (P) => {
    const inner = `${rect(0, 32, 420, 220, 0, "#f6f8fc")}
      ${card(22, 48, 168, 182, "#ffffff", 10)}
      ${circle(52, 78, 16, P.p)}${lines(76, 68, [70, 44], 12, P.dark, 6, 0.75)}
      ${rect(36, 108, 140, 5, 2.5, P.p, 'opacity="0.35"')}
      ${lines(36, 124, [140, 124, 132, 100, 136, 110, 80], 14, P.dark, 4, 0.2)}
      ${card(208, 48, 190, 84, "#ffffff", 10)}
      ${star4(234, 76, 14, P.s)}${lines(258, 64, [100, 74], 14, P.dark, 5, 0.6)}
      ${rect(222, 100, 70, 20, 10, P.p)}${rect(300, 100, 62, 20, 10, P.t)}
      ${card(208, 144, 190, 86, "#ffffff", 10)}
      ${lines(222, 158, [150, 130, 140, 90], 14, P.dark, 4, 0.2)}${check(374, 210, 7, P.t, 4)}`;
    return browser(P, 320, 190, 420, 252, inner, -2, "b6");
  },

  "browser-resize": (P) => {
    const inner = `${rect(0, 32, 420, 220, 0, "#f6f8fc")}
      ${rect(26, 54, 210, 150, 12, "#cfe2ff")}
      ${circle(180, 94, 18, P.s)}${path("M26 204V150L90 100L140 160L176 130L236 190V204Z", P.p)}${path("M26 204V176L72 146L120 204Z", P.dark, 'opacity="0.35"')}
      ${[0, 1, 2, 3].map((i) => rect([22, 230, 22, 230][i] - 4, [50, 50, 200, 200][i] - 4, 10, 10, 2, "#fff", `stroke="${P.dark}" stroke-width="2"`)).join("")}
      ${rect(254, 54, 140, 78, 10, "#e8d5ff")}${path("M254 132V104L284 84L312 112L338 98L394 132Z", P.s)}${circle(366, 76, 9, "#fff")}
      ${rect(254, 142, 90, 62, 10, "#ffe1d6")}${path("M254 204V178L276 162L298 182L316 170L344 204Z", P.t)}
      ${path("M240 130L250 124L250 136Z", P.dark)}
      ${rect(26, 218, 368, 6, 3, "#dfe5ef")}${rect(26, 218, 210, 6, 3, P.p)}${circle(236, 221, 8, "#fff", `stroke="${P.p}" stroke-width="3"`)}`;
    return browser(P, 320, 190, 420, 252, inner, 2, "b7");
  },

  "browser-portfolio": (P) => {
    const tile = (x: number, y: number, c: string, shape: number) =>
      `${rect(x, y, 100, 66, 10, c)}${shape === 0 ? circle(x + 50, y + 33, 16, "#fff", 'opacity="0.8"') : shape === 1 ? rect(x + 26, y + 18, 48, 30, 6, "#fff", 'opacity="0.8"') : path(`M${x + 20} ${y + 50}L${x + 50} ${y + 16}L${x + 80} ${y + 50}Z`, "#fff", 'opacity="0.8"')}`;
    const inner = `${rect(0, 32, 430, 230, 0, "#f6f8fc")}
      ${circle(54, 84, 26, P.p)}${circle(54, 78, 9, "#fff")}${path("M38 100C38 88 70 88 70 100Z", "#fff")}
      ${lines(26, 124, [64, 44], 14, P.dark, 6, 0.7)}${rect(26, 160, 56, 20, 10, P.s)}${rect(26, 188, 90, 20, 10, "#fff", `stroke="${P.dark}" stroke-opacity="0.25" stroke-width="2"`)}
      ${tile(130, 52, P.p, 0)}${tile(238, 52, P.s, 1)}${tile(346, 52, P.t, 2)}
      ${tile(130, 128, P.t, 1)}${tile(238, 128, P.p, 2)}${tile(346, 128, P.s, 0)}
      ${lines(130, 210, [100, 100, 100], 0, P.dark, 4, 0.2)}`;
    return browser(P, 320, 190, 460, 262, inner, 0, "b8");
  },

  "browser-local": (P) => {
    const ev = (y: number, c: string) =>
      `${card(236, y, 168, 52, "#fff", 10)}${rect(246, y + 8, 36, 36, 8, c)}${rect(254, y + 17, 20, 4, 2, "#fff")}${rect(254, y + 26, 20, 10, 2, "#fff", 'opacity="0.7"')}${lines(292, y + 14, [90, 60], 14, P.dark, 5, 0.5)}`;
    const inner = `${rect(0, 32, 420, 230, 0, "#f6f8fc")}
      ${rect(18, 48, 200, 196, 12, "#dff0e6")}
      ${path("M18 150L120 120L218 160", "none", `stroke="#fff" stroke-width="10"`)}${path("M110 48L96 244", "none", `stroke="#fff" stroke-width="10"`)}${path("M150 48L170 244", "none", `stroke="#fff" stroke-width="6"`)}
      ${rect(30, 70, 52, 38, 6, "#bfe3cf")}${rect(124, 68, 70, 40, 6, "#bfe3cf")}${rect(130, 176, 74, 52, 6, "#bfe3cf")}${circle(52, 196, 24, "#9fd6f0")}
      ${[[70, 130], [150, 98], [176, 196]].map(([x, y], i) => `<g transform="translate(${x} ${y})"><path d="M0 22C-14 6 -16 -2 -16 -8A16 16 0 0 1 16 -8C16 -2 14 6 0 22Z" fill="${[P.p, P.t, P.s][i]}"/>${circle(0, -8, 6, "#fff")}</g>`).join("")}
      ${ev(52, P.p)}${ev(112, P.s)}${ev(172, P.t)}`;
    return browser(P, 320, 190, 420, 262, inner, -1, "b9");
  },

  "browser-quote": (P) => {
    const field = (y: number) => `${rect(24, y, 232, 30, 8, "#f1f3f7")}${lines(34, y + 11, [90], 0, P.dark, 6, 0.3)}`;
    const inner = `${rect(0, 32, 430, 230, 0, "#f6f8fc")}
      ${card(14, 46, 270, 198, "#fff", 12)}
      ${lines(24, 60, [90], 0, P.dark, 7, 0.7)}${field(80)}${field(120)}
      ${[0, 1, 2].map((i) => `${rect(24 + i * 78, 162, 70, 24, 12, i === 1 ? P.p : "#eef0f5")}`).join("")}
      ${rect(24, 198, 232, 32, 10, P.p)}${lines(110, 210, [60], 0, "#fff", 8)}
      ${card(298, 62, 116, 110, "#fff", 12)}
      ${circle(356, 98, 22, P.t, 'opacity="0.25"')}${path("M345 98L354 107L370 88", "none", `stroke="${P.t}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`)}
      ${lines(316, 132, [80, 56], 14, P.dark, 6, 0.4)}
      ${rect(306, 190, 100, 26, 13, P.s)}`;
    return browser(P, 320, 190, 430, 262, inner, 1, "b10");
  },

  "service-consult": (P) =>
    `${g(rect(0, 0, 220, 112, 22, "#ffffff") + path("M30 112L20 148L64 112Z", "#ffffff") + lines(28, 28, [160, 130, 100], 24, P.dark, 9, 0.35), "translate(96 60) rotate(-3)", 'filter="url(#sh)"')}
     ${g(rect(0, 0, 190, 94, 22, P.p) + path("M160 94L176 124L128 94Z", P.p) + lines(24, 24, [120, 90], 24, "#fff", 9, 0.9), "translate(300 160) rotate(3)", 'filter="url(#sh)"')}
     ${g(card(0, 0, 90, 118, "#fff", 12) + rect(30, -8, 30, 16, 6, P.dark) + [0, 1, 2].map((i) => circle(20, 30 + i * 30, 8, P.t, 'opacity="0.9"') + check(20, 30 + i * 30, 3.5, "#fff", 2.2) + rect(36, 26 + i * 30, 42, 8, 4, P.dark, 'opacity="0.25"')).join(""), "translate(470 80) rotate(6)")}
     ${heart(120, 270, 16, P.t)}${star4(560, 270, 16, P.s)}${star4(70, 190, 10, "#fff")}`,

  "service-review": (P) =>
    `${card(130, 50, 300, 250, "#fff", 14)}
     ${rect(146, 66, 268, 28, 8, P.bg[0], 'opacity="0.6"')}
     ${rect(146, 106, 268, 70, 10, P.p, 'opacity="0.18"')}${lines(162, 120, [150, 100], 22, P.dark, 8, 0.5)}${rect(162, 156, 70, 14, 7, P.p)}
     ${lines(146, 194, [268, 240, 256, 200], 16, P.dark, 6, 0.15)}
     ${g(circle(0, 0, 54, "#ffffff", 'fill-opacity="0.35"') + circle(0, 0, 54, "none", `stroke="${P.dark}" stroke-width="12"`) + line(40, 40, 92, 92, P.dark, 18), "translate(420 200)", 'filter="url(#sh)"')}
     ${circle(520, 98, 28, P.t, 'filter="url(#sh2)"')}${check(520, 98, 11, "#fff", 6)}${star4(110, 300, 12, P.s)}`,

  "service-docs": (P) => {
    const folder = (x: number, y: number, c: string, rot: number) =>
      g(path("M0 18Q0 8 10 8H48L60 22H150Q160 22 160 32V118Q160 128 150 128H10Q0 128 0 118Z", c) + rect(0, 40, 160, 88, 12, c, 'opacity="0.9"') + lines(16, 66, [90, 60], 18, "#fff", 7, 0.6), `translate(${x} ${y}) rotate(${rot})`, 'filter="url(#sh2)"');
    return `${folder(60, 190, P.t, -4)}${folder(250, 170, P.s, 3)}${folder(410, 196, P.p, -2)}
     ${g(rect(0, 0, 90, 116, 8, "#fff") + lines(12, 18, [60, 50, 56, 36], 16, P.dark, 5, 0.3), "translate(140 66) rotate(-8)", 'filter="url(#sh2)"')}
     ${g(rect(0, 0, 90, 116, 8, "#fff") + lines(12, 18, [60, 40, 56, 48], 16, P.dark, 5, 0.3) + circle(70, 94, 12, P.s), "translate(300 50) rotate(6)", 'filter="url(#sh2)"')}
     ${circle(540, 84, 26, P.t)}${check(540, 84, 10, "#fff", 5)}`;
  },

  "service-subtitle": (P) =>
    `${g(rect(0, 0, 340, 192, 16, P.dark) + rect(12, 12, 316, 168, 10, P.bg[1], 'opacity="0.55"') + circle(170, 82, 30, "#ffffff", 'opacity="0.9"') + path("M162 66L186 82L162 98Z", P.p) + rect(60, 138, 220, 22, 8, "#000", 'opacity="0.55"') + lines(78, 145, [184], 0, "#fff", 7, 0.95), "translate(150 44) rotate(-2)", 'filter="url(#sh)"')}
     ${rect(150, 266, 340, 6, 3, "#fff", 'opacity="0.4"')}${rect(150, 266, 190, 6, 3, P.s)}
     ${Array.from({ length: 22 }, (_, i) => rect(150 + i * 15.5, 300 - (6 + ((i * 7) % 5) * 5), 8, 12 + ((i * 7) % 5) * 10, 4, i < 12 ? P.p : "#ffffff", i < 12 ? "" : 'opacity="0.5"')).join("")}
     ${g(rect(0, 0, 120, 52, 14, "#fff") + lines(16, 14, [88, 56], 14, P.dark, 6, 0.45), "translate(40 220) rotate(-6)", 'filter="url(#sh2)"')}${star4(540, 70, 14, P.s)}`,

  "service-feedback": (P) => {
    const pin = (x: number, y: number, c: string, n: number) =>
      `${circle(x, y, 15, c, 'filter="url(#sh2)"')}${n === 1 ? rect(x - 2, y - 7, 4, 14, 2, "#fff") : n === 2 ? stroke(`M${x - 6} ${y - 4}Q${x} ${y - 10} ${x + 6} ${y - 4}L${x - 6} ${y + 7}H${x + 6}`, "#fff", 3) : check(x, y, 5, "#fff", 3)}`;
    const inner = `${rect(0, 32, 380, 220, 0, "#f6f8fc")}${rect(16, 46, 348, 54, 10, P.p, 'opacity="0.25"')}${lines(30, 60, [160, 100], 18, P.dark, 7, 0.5)}
      ${rect(16, 112, 106, 70, 10, "#fff")}${rect(136, 112, 106, 70, 10, "#fff")}${rect(256, 112, 108, 70, 10, "#fff")}${rect(16, 196, 348, 40, 10, "#fff")}
      ${lines(26, 124, [70, 52], 14, P.dark, 5, 0.2)}${lines(146, 124, [70, 52], 14, P.dark, 5, 0.2)}${lines(266, 124, [70, 52], 14, P.dark, 5, 0.2)}`;
    return (
      browser(P, 290, 190, 380, 252, inner, -2, "b15") +
      pin(160, 120, P.t, 1) + pin(380, 160, P.s, 2) + pin(230, 290, P.p, 3) +
      g(path("M0 0L0 30L9 22L16 36L23 33L16 20L28 20Z", P.dark, 'stroke="#fff" stroke-width="2.5" stroke-linejoin="round"'), "translate(330 210)") +
      g(rect(0, 0, 150, 56, 14, "#fff") + path("M14 56L8 76L40 56Z", "#fff") + lines(16, 14, [114, 78], 16, P.dark, 6, 0.45), "translate(450 66)", 'filter="url(#sh2)"')
    );
  },

  cafe: (P) =>
    `${rect(0, 292, W, 68, 0, P.dark, 'opacity="0.12"')}
     ${g(rect(-6, 0, 12, 46, 6, "#6a4a2e") + [-34, 0, 34].map((x, i) => path(`M0 8Q${x} ${-30 - (i % 2) * 14} ${x * 1.2} ${-58 - (i % 2) * 14}Q${x * 0.4} ${-26} 0 8Z`, P.s === "#7a4b2e" ? "#4f9d6e" : "#4f9d6e")).join("") + path("M-30 46H30L24 84H-24Z", P.p), "translate(110 236)")}
     ${ellipse(330, 298, 150, 22, P.dark, 'opacity="0.2"')}
     ${ellipse(330, 276, 140, 24, "#ffffff", 'filter="url(#sh2)"')}${ellipse(330, 270, 110, 17, "#f1ebe4")}
     ${path("M232 150H428L410 258Q404 284 380 284H280Q256 284 250 258Z", "#ffffff", 'filter="url(#sh)"')}
     ${path("M241 200H419L410 258Q404 284 380 284H280Q256 284 250 258Z", P.bg[1], 'opacity="0.35"')}
     ${path("M428 170H452Q484 170 484 204Q484 240 446 240H416", "none", 'stroke="#fff" stroke-width="16" stroke-linecap="round"')}
     ${ellipse(330, 152, 98, 18, "#5b3a22")}${ellipse(330, 152, 84, 13, "#8a5a36")}
     ${heart(330, 152, 9, "#f3e3cf")}
     ${stroke("M290 118Q272 92 292 66Q310 44 292 22", "#ffffff", 5, 'opacity="0.8"')}${stroke("M335 114Q317 88 337 62Q355 40 337 18", "#ffffff", 5, 'opacity="0.8"')}${stroke("M380 118Q362 92 382 66Q400 44 382 22", "#ffffff", 5, 'opacity="0.8"')}
     ${g(circle(0, 0, 26, "#d9a066") + circle(-8, -6, 3.5, "#7a4b2e") + circle(8, -9, 3.5, "#7a4b2e") + circle(6, 8, 3.5, "#7a4b2e"), "translate(530 288)")}
     ${star4(560, 90, 14, "#fff")}${star4(70, 100, 10, "#fff")}`,

  burger: (P) =>
    `${ellipse(330, 318, 190, 20, P.dark, 'opacity="0.18"')}
     ${g(
       path("M-120 0C-120 -90 -60 -120 0 -120C60 -120 120 -90 120 0Z", "#e9a24a") +
         path("M-120 0C-120 -90 -60 -120 0 -120C60 -120 120 -90 120 0Z", "#fff", 'opacity="0.12"') +
         [[-60, -66], [-20, -90], [30, -84], [64, -56], [-4, -52], [-84, -30], [96, -28]].map(([x, y]) => ellipse(x, y, 7, 3.5, "#fff3d0", `transform="rotate(${x} ${x} ${y})"`)).join("") +
         path("M-128 6Q-108 -8 -88 6T-48 6T-8 6T32 6T72 6T112 6T132 6V14H-128Z", "#58b368") +
         path("M-124 8H124L0 56Z", "#ffc83d", 'opacity="0.95"') +
         rect(-124, 22, 248, 34, 17, "#6b3b25") + rect(-124, 22, 248, 12, 6, "#fff", 'opacity="0.1"') +
         rect(-116, 58, 232, 12, 6, "#ef4444") +
         path("M-120 74H120Q120 116 70 116H-70Q-120 116 -120 74Z", "#e9a24a"),
       "translate(330 170)",
       'filter="url(#sh)"',
     )}
     ${g(path("M-34 0H34L28 92H-28Z", P.t) + rect(-40, -6, 80, 12, 6, "#ffffff") + [-22, -8, 8, 22].map((x) => rect(x - 4, -56, 8, 54, 4, "#ffd166")).join(""), "translate(536 218) rotate(4)", 'filter="url(#sh2)"')}
     ${g(path("M-28 0H28L22 84H-22Z", "#ffffff") + rect(-28, 0, 56, 38, 0, P.p) + ellipse(0, 0, 28, 6, "#ffffff") + line(8, -14, 22, -50, P.dark, 5), "translate(102 224) rotate(-4)", 'filter="url(#sh2)"')}
     ${star4(556, 80, 14, "#fff")}${star4(86, 90, 10, "#fff")}`,

  workshop: (P) =>
    `${rect(40, 288, 560, 14, 7, P.dark, 'opacity="0.2"')}
     ${g(
       path("M-56 -118C-56 -140 -30 -140 -30 -118L-36 -90C-8 -68 60 -34 50 40C46 84 8 100 0 100C-8 100 -50 84 -52 40C-60 -34 -2 -68 -26 -90Z", P.p) +
         path("M-48 20Q0 38 52 20", "none", 'stroke="#fff" stroke-width="5" stroke-opacity="0.55"') +
         path("M-50 50Q0 68 50 50", "none", 'stroke="#fff" stroke-width="5" stroke-opacity="0.55"') +
         path("M-30 -118L30 -118", "none", `stroke="${P.dark}" stroke-width="3" stroke-opacity="0.3"`),
       "translate(320 184)",
       'filter="url(#sh)"',
     )}
     ${g(path("M0 0H70L62 80Q60 94 46 94H24Q10 94 8 80Z", P.s) + ellipse(35, 0, 35, 8, "#fff", 'opacity="0.5"'), "translate(110 196)", 'filter="url(#sh2)"')}
     ${g(path("M0 0H56L50 66Q48 80 36 80H20Q8 80 6 66Z", P.t) + path("M56 12Q76 12 74 34Q72 50 52 48", "none", 'stroke="' + P.t + '" stroke-width="8" stroke-linecap="round"'), "translate(470 220)", 'filter="url(#sh2)"')}
     ${rect(80, 78, 130, 8, 4, P.dark, 'opacity="0.3"')}${rect(96, 56, 22, 22, 4, P.s)}${rect(124, 46, 26, 32, 4, P.t)}${rect(158, 62, 24, 16, 4, "#fff")}
     ${rect(440, 90, 130, 8, 4, P.dark, 'opacity="0.3"')}${circle(470, 76, 14, P.p)}${circle(506, 78, 12, P.s)}${rect(528, 60, 24, 30, 5, "#fff", 'opacity="0.9"')}
     ${star4(560, 170, 11, "#fff")}`,

  gym: (P) =>
    `${ellipse(320, 306, 230, 22, P.dark, 'opacity="0.18"')}
     ${g(
       rect(-170, -8, 340, 16, 8, "#c4cad6") + rect(-170, -8, 340, 5, 2.5, "#fff", 'opacity="0.55"') +
         [[-150, 1], [-124, 0.8], [124, 0.8], [150, 1]].map(([x, s]) => rect(x - 12, -74 * s, 24, 148 * s, 10, P.dark)).join("") +
         [[-176, 0.9], [176, 0.9]].map(([x, s]) => rect(x - 7, -58 * s, 14, 116 * s, 6, "#9aa3b4")).join("") +
         rect(-146, -34, 44, 68, 8, P.p, 'opacity="0.0"'),
       "translate(310 150) rotate(-14)",
       'filter="url(#sh)"',
     )}
     ${g(
       path("M-24 -86Q-24 -118 0 -118Q24 -118 24 -86", "none", `stroke="${P.dark}" stroke-width="14" stroke-linecap="round"`) +
         circle(0, -14, 64, P.p) + circle(0, -14, 64, "none", `stroke="#fff" stroke-opacity="0.25" stroke-width="10"`) + rect(-24, -24, 48, 20, 6, "#fff", 'opacity="0.5"'),
       "translate(500 232)",
       'filter="url(#sh)"',
     )}
     ${g(ellipse(0, 0, 38, 12, P.s) + rect(-38, -10, 76, 10, 0, P.s) + ellipse(0, -10, 38, 12, P.s) + ellipse(0, -10, 28, 7, "#fff", 'opacity="0.35"'), "translate(100 272)", 'filter="url(#sh2)"')}
     ${star4(560, 70, 12, "#fff")}${star4(90, 80, 9, "#fff")}`,

  salon: (P) =>
    `${g(
       ellipse(0, 0, 110, 150, "#d99a5a") + ellipse(0, 0, 98, 138, "#ffffff") + ellipse(0, 0, 98, 138, P.bg[0], 'opacity="0.55"') +
         path("M-60 -70Q-30 -110 20 -100", "none", 'stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-opacity="0.8"') +
         rect(-14, 150, 28, 26, 6, "#b9783a"),
       "translate(190 170)",
       'filter="url(#sh)"',
     )}
     ${g(
       path("M0 0L120 -150", "none", `stroke="#d9dee8" stroke-width="12" stroke-linecap="round"`) +
         path("M0 0L120 150", "none", `stroke="#bfc6d4" stroke-width="12" stroke-linecap="round"`) +
         circle(-6, -34, 34, "none", `stroke="${P.p}" stroke-width="12"`) + circle(-6, 34, 34, "none", `stroke="${P.p}" stroke-width="12"`) + circle(0, 0, 8, P.dark),
       "translate(430 190) rotate(-24) scale(0.95)",
       'filter="url(#sh2)"',
     )}
     ${g(rect(0, 0, 130, 26, 8, P.s) + Array.from({ length: 14 }, (_, i) => rect(6 + i * 8.6, 26, 4, 22, 2, P.s)).join(""), "translate(380 296) rotate(-4)", 'filter="url(#sh2)"')}
     ${heart(530, 90, 14, P.t)}${star4(70, 60, 12, "#fff")}${star4(560, 286, 11, "#fff")}`,

  organizer: (P) =>
    `${rect(0, 276, W, 84, 0, P.dark, 'opacity="0.10"')}
     ${g(
       [0, 1, 2].map((i) => rect(30 + i * 26, -86 - i * 6, 11, 100 + i * 6, 5, [P.p, P.t, P.s][i])).join("") +
         rect(150, -70, 72, 70, 4, P.t, 'opacity="0.95"') + lines(160, -56, [48, 36], 14, "#fff", 5, 0.8) +
         rect(8, -8, 304, 140, 18, "#ffffff") + rect(8, -8, 304, 140, 18, P.bg[0], 'opacity="0.5"') +
         [8, 90, 172, 254].map((x, i) => rect(x + 8, -2, i === 3 ? 50 : 66, 128, 12, "#ffffff", 'opacity="0.55"')).join("") +
         rect(8, 62, 304, 70, 0, "#ffffff", 'opacity="0.35"'),
       "translate(166 134)",
       'filter="url(#sh)"',
     )}
     ${g(rect(0, 0, 70, 70, 6, P.s) + lines(10, 16, [46, 36, 40], 14, P.dark, 5, 0.5), "translate(470 110) rotate(8)", 'filter="url(#sh2)"')}
     ${g(circle(0, 0, 30, "none", `stroke="${P.dark}" stroke-width="7" stroke-opacity="0.7"`) + circle(0, 0, 14, "none", `stroke="${P.dark}" stroke-width="7" stroke-opacity="0.7"`), "translate(530 270)")}
     ${star4(80, 90, 12, "#fff")}`,

  "earbuds-pouch": (P) =>
    `${ellipse(320, 306, 190, 18, P.dark, 'opacity="0.16"')}
     ${g(
       rect(-130, -80, 260, 160, 56, P.p) + rect(-130, -80, 260, 160, 56, "#fff", 'opacity="0.08"') +
         path("M-110 -40H110", "none", `stroke="${P.dark}" stroke-width="5" stroke-dasharray="3 9" stroke-linecap="round" stroke-opacity="0.45"`) +
         rect(-24, -64, 48, 24, 8, P.dark, 'opacity="0.85"') + rect(-16, -30, 32, 42, 8, "#fff", 'opacity="0.0"') +
         rect(100, -28, 16, 56, 8, P.s) + circle(108, -38, 5, P.dark),
       "translate(320 210) rotate(-3)",
       'filter="url(#sh)"',
     )}
     ${g(ellipse(0, 0, 22, 28, "#ffffff") + rect(-5, 20, 10, 52, 5, "#ffffff") + circle(0, -6, 7, "#d6dae2"), "translate(236 86) rotate(-14)", 'filter="url(#sh2)"')}
     ${g(ellipse(0, 0, 22, 28, "#ffffff") + rect(-5, 20, 10, 52, 5, "#ffffff") + circle(0, -6, 7, "#d6dae2"), "translate(310 76) rotate(10)", 'filter="url(#sh2)"')}
     ${stroke("M380 100Q440 60 480 110T560 130", P.dark, 5, 'opacity="0.55"')}${circle(560, 130, 8, P.dark, 'opacity="0.55"')}
     ${star4(120, 110, 13, "#fff")}${star4(540, 290, 11, "#fff")}`,

  lantern: (P) =>
    `${path("M0 360L150 150L300 360Z", P.dark, 'opacity="0.55"')}${path("M360 360L500 190L640 360Z", P.dark, 'opacity="0.7"')}
     ${circle(520, 70, 26, "#fff7d6", 'opacity="0.95"')}${circle(532, 62, 22, P.bg[0])}
     ${[[80, 60], [160, 110], [260, 50], [420, 90], [590, 140], [60, 180]].map(([x, y]) => circle(x, y, 2.5, "#fff", 'opacity="0.8"')).join("")}
     <defs><radialGradient id="glow"><stop offset="0" stop-color="#ffe9a8" stop-opacity="0.95"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient></defs>
     ${circle(320, 210, 190, "url(#glow)")}
     ${g(
       path("M-18 -92Q0 -128 18 -92", "none", `stroke="#c4cad6" stroke-width="7" stroke-linecap="round"`) +
         rect(-46, -92, 92, 20, 8, P.dark) +
         rect(-50, -76, 100, 120, 16, "#ffe9a8") + rect(-50, -76, 100, 120, 16, "#fff", 'opacity="0.35"') +
         [-26, 0, 26].map((x) => rect(x - 3, -70, 6, 108, 3, P.dark, 'opacity="0.35"')).join("") +
         rect(-56, 40, 112, 26, 10, P.dark) + circle(0, -22, 18, "#fff", 'opacity="0.8"'),
       "translate(320 190)",
       'filter="url(#sh)"',
     )}
     ${g(path("M0 0L50 -78L100 0Z", P.s) + path("M50 -78L50 0", "none", 'stroke="#000" stroke-opacity="0.2" stroke-width="3"'), "translate(80 290)")}
     ${rect(0, 330, W, 30, 0, P.dark, 'opacity="0.55"')}`,

  stickers: (P) => {
    const outline = 'stroke="#ffffff" stroke-width="8" stroke-linejoin="round" paint-order="stroke"';
    return `${rect(70, 40, 500, 280, 24, "#ffffff", 'opacity="0.55"')}
     ${g(circle(0, 0, 50, P.s, outline) + circle(-16, -8, 6, P.dark) + circle(16, -8, 6, P.dark) + stroke("M-14 14Q0 26 14 14", P.dark, 5) + path("M-42 -34L-30 -66L-10 -46Z", P.s, outline) + path("M42 -34L30 -66L10 -46Z", P.s, outline), "translate(170 120) rotate(-8)", 'filter="url(#sh2)"')}
     ${g(path("M0 -50L14 -16L50 -14L22 8L32 44L0 24L-32 44L-22 8L-50 -14L-14 -16Z", P.t, outline), "translate(330 110) rotate(10)", 'filter="url(#sh2)"')}
     ${g(heart(0, 0, 38, P.p).replace("<path ", `<path ${outline} `), "translate(480 120) rotate(8)", 'filter="url(#sh2)"')}
     ${g(path("M-60 20Q-70 -20 -30 -22Q-24 -56 16 -48Q40 -64 58 -30Q86 -26 70 20Z", "#ffffff", `stroke="${P.dark}" stroke-opacity="0.25" stroke-width="3"`) + circle(-12, -4, 4.5, P.dark) + circle(22, -4, 4.5, P.dark) + stroke("M-2 10Q4 16 10 10", P.dark, 4), "translate(190 250) rotate(6)", 'filter="url(#sh2)"')}
     ${g(circle(0, 0, 46, P.s, outline) + circle(0, 0, 30, "#fff", 'opacity="0.35"') + path("M-14 -4Q0 -26 14 -4", "none", `stroke="${P.dark}" stroke-width="6" stroke-linecap="round"`) + circle(0, 12, 6, P.dark), "translate(340 256) rotate(-6)", 'filter="url(#sh2)"')}
     ${g(rect(-46, -34, 92, 68, 18, P.p, outline) + circle(-16, -6, 6, "#fff") + circle(16, -6, 6, "#fff") + stroke("M-12 12Q0 22 12 12", "#fff", 5), "translate(480 250) rotate(-4)", 'filter="url(#sh2)"')}`;
  },

  "drip-bag": (P) =>
    `${ellipse(320, 312, 190, 18, P.dark, 'opacity="0.18"')}
     ${path("M190 150H450L432 270Q428 298 400 298H240Q212 298 208 270Z", "#ffffff", 'filter="url(#sh)"')}
     ${path("M199 200H441L432 270Q428 298 400 298H240Q212 298 208 270Z", P.p, 'opacity="0.25"')}
     ${path("M452 176H476Q508 176 508 210Q508 246 470 246H436", "none", 'stroke="#fff" stroke-width="16" stroke-linecap="round"')}
     ${ellipse(320, 150, 130, 20, "#4a2c1a")}${ellipse(320, 150, 116, 14, "#6a3f23")}
     ${g(rect(-52, -6, 104, 150, 6, "#f8f1e5") + path("M-52 -6L-44 -16L-34 -6L-24 -16L-14 -6L-4 -16L6 -6L16 -16L26 -6L36 -16L44 -6L52 -16V-6Z", "#f8f1e5") + rect(-52, 8, 104, 42, 0, P.s) + circle(0, 29, 12, "#fff", 'opacity="0.9"') + lines(-34, 70, [68, 50], 14, P.dark, 5, 0.35) + path("M-40 150H40", "none", `stroke="${P.dark}" stroke-width="3" stroke-opacity="0.2"`), "translate(320 20) rotate(0)", 'filter="url(#sh2)"')}
     ${[[110, 110], [150, 70], [96, 180], [550, 120], [520, 70]].map(([x, y], i) => ellipse(x, y, 13, 18, "#5b3a22", `transform="rotate(${i * 40} ${x} ${y})"`) + line(x, y - 14, x, y + 14, "#2f1c10", 3, `transform="rotate(${i * 40} ${x} ${y})"`)).join("")}
     ${stroke("M290 130Q272 108 292 88", "#fff", 5, 'opacity="0.0"')}`,

  shorts: (P) =>
    `${g(rect(-80, -150, 160, 300, 26, P.dark) + rect(-72, -142, 144, 284, 20, P.bg[1], 'opacity="0.9"') + circle(0, -20, 44, "#fff", 'opacity="0.95"') + path("M-14 -42L22 -20L-14 2Z", P.p) + rect(-58, 72, 90, 8, 4, "#fff", 'opacity="0.9"') + rect(-58, 90, 56, 8, 4, "#fff", 'opacity="0.55"') + circle(-60, 116, 10, P.s), "translate(250 180) rotate(-4)", 'filter="url(#sh)"')}
     ${[0, 1, 2].map((i) => circle(380, 100 + i * 70, 24, "#ffffff", 'filter="url(#sh2)"')).join("")}
     ${heart(380, 100, 11, P.t)}${rect(369, 160, 22, 20, 5, P.s)}${path("M373 180L370 190L380 182Z", P.s)}${path("M368 242L380 232L392 242L380 252Z", P.p)}${path("M380 256L392 242L380 232Z", P.p)}
     ${g(circle(0, 0, 54, "#ffffff", 'filter="url(#sh2)"') + circle(0, 0, 42, "none", `stroke="${P.p}" stroke-width="7"`) + line(0, 0, 0, -26, P.dark, 6) + line(0, 0, 18, 10, P.dark, 6), "translate(500 262)")}
     ${star4(520, 80, 16, P.s)}${star4(110, 90, 11, "#fff")}${star4(100, 290, 9, P.t)}`,

  blog: (P) => {
    const code = (y: number, ws: number[], cs: string[]) =>
      ws.map((w, i) => rect(24 + ws.slice(0, i).reduce((a, b) => a + b + 8, 0), y, w, 7, 3.5, cs[i % cs.length])).join("");
    const inner = `${rect(0, 32, 440, 230, 0, P.dark)}
      ${rect(0, 32, 40, 230, 0, "#000", 'opacity="0.2"')}
      ${code(58, [40, 70, 28], [P.p, "#fff", P.s])}${code(78, [24, 92], [P.t, "#fff"])}${code(98, [20, 52, 44], [P.s, "#fff", P.p])}${code(118, [64, 38], ["#fff", P.t])}${code(138, [28, 80, 20], [P.p, "#fff", P.s])}${code(158, [50, 60], [P.s, "#fff"])}${code(178, [18, 30], ["#fff", P.p])}`;
    return (
      browser(P, 290, 190, 440, 262, inner, -3, "b27") +
      g(card(0, 0, 190, 214, "#fff", 14) + rect(12, 12, 166, 76, 10, P.p, 'opacity="0.85"') + path("M12 88V62L60 36L100 70L130 52L178 88Z", "#fff", 'opacity="0.45"') + lines(12, 106, [120, 150, 138, 100, 144], 18, P.dark, 6, 0.25) + rect(12, 190, 60, 10, 5, P.s), "translate(420 80) rotate(5)", "")
    );
  },

  insta: (P) => {
    const tiles: string[] = [];
    const cols = [P.p, P.s, P.t, "#fff", P.t, P.p, P.s, "#fff", P.p];
    for (let i = 0; i < 9; i++) {
      const x = 170 + (i % 3) * 100;
      const y = 40 + Math.floor(i / 3) * 100;
      const c = cols[i];
      const deco = i % 3 === 0 ? circle(x + 50, y + 50, 22, "#fff", 'opacity="0.8"') : i % 3 === 1 ? path(`M${x + 8} ${y + 92}L${x + 40} ${y + 40}L${x + 92 - 8} ${y + 92}Z`, "#fff", 'opacity="0.75"') : rect(x + 24, y + 28, 52, 44, 8, "#fff", 'opacity="0.78"');
      tiles.push(rect(x, y, 92, 92, 10, c, 'filter="url(#sh2)"') + deco);
    }
    return (
      tiles.join("") +
      g(circle(0, 0, 40, "none", `stroke="${P.t}" stroke-width="8"`) + circle(0, 0, 28, "#fff") + circle(0, -6, 10, P.p) + path("M-16 18C-16 4 16 4 16 18Z", P.p), "translate(90 110)", 'filter="url(#sh2)"') +
      heart(496, 330, 13, P.t) + g(rect(0, 0, 24, 30, 5, "#fff"), "translate(530 316)") + g(path("M0 0L30 -14L20 16L12 6Z", "#fff"), "translate(560 330)")
    );
  },

  quote: (P) =>
    `${g(rect(0, 0, 320, 170, 28, "#ffffff") + path("M60 170L40 214L110 170Z", "#ffffff") + g(path("M0 0Q0 -30 30 -34L30 -22Q14 -18 14 -6H30V20H0Z", P.p) + path("M44 0Q44 -30 74 -34L74 -22Q58 -18 58 -6H74V20H44Z", P.p), "translate(36 52)") + lines(36, 100, [210, 150], 24, P.dark, 9, 0.3), "translate(160 60) rotate(-3)", 'filter="url(#sh)"')}
     ${g(rect(0, 0, 150, 84, 22, P.s) + path("M110 84L130 112L80 84Z", P.s) + lines(20, 22, [96, 64], 22, P.dark, 8, 0.5), "translate(420 190) rotate(4)", 'filter="url(#sh2)"')}
     ${g(card(0, 0, 78, 88, "#fff", 12) + rect(0, 0, 78, 24, 12, P.t) + rect(0, 12, 78, 12, 0, P.t) + circle(39, 56, 18, P.t, 'opacity="0.2"') + check(39, 56, 8, P.t, 5), "translate(80 210) rotate(-6)")}
     ${star4(560, 80, 15, "#fff")}${star4(110, 90, 11, P.s)}`,

  "ai-channel": (P) =>
    `${path("M60 270H190V220H260", "none", `stroke="${P.p}" stroke-width="3" stroke-opacity="0.5"`)}${path("M580 90H470V140H400", "none", `stroke="${P.p}" stroke-width="3" stroke-opacity="0.5"`)}${circle(60, 270, 6, P.p)}${circle(580, 90, 6, P.p)}
     ${g(
       line(0, -108, 0, -140, P.light, 6) + circle(0, -146, 10, P.s) +
         rect(-110, -108, 220, 170, 38, "#ffffff") + rect(-96, -94, 192, 142, 28, P.dark) +
         ellipse(-42, -26, 22, 26, P.p) + ellipse(42, -26, 22, 26, P.p) + circle(-36, -34, 7, "#fff") + circle(48, -34, 7, "#fff") +
         rect(-34, 12, 68, 14, 7, P.s) +
         rect(-124, -52, 14, 52, 7, P.light) + rect(110, -52, 14, 52, 7, P.light),
       "translate(320 190)",
       'filter="url(#sh)"',
     )}
     ${g(rect(0, 0, 76, 54, 14, P.t) + path("M30 14L52 27L30 40Z", "#fff"), "translate(450 250) rotate(-6)", 'filter="url(#sh2)"')}
     ${star4(160, 110, 16, P.s)}${star4(520, 230, 10, P.p)}${star4(110, 220, 9, "#fff")}`,

  beta: (P) => {
    const screen = `${rect(-62, -120, 124, 36, 0, P.p)}${lines(-48, -106, [56, 32], 10, "#fff", 5)}
      ${[0, 1, 2].map((i) => `${rect(-52, -66 + i * 52, 104, 42, 10, "#f3f4f7")}${circle(-34, -45 + i * 52, 12, [P.t, P.s, P.p][i])}${lines(-14, -53 + i * 52, [56, 36], 14, P.dark, 5, 0.4)}`).join("")}
      ${rect(-52, 96, 104, 20, 10, P.s)}`;
    return (
      phone(P, 240, 185, screen, -5, "#fff", "p31") +
      g(path("M-18 -70H18V-26L52 40Q62 62 40 66H-40Q-62 62 -52 40L-18 -26Z", "#ffffff") + path("M-46 34H46L52 46Q58 62 40 62H-40Q-58 62 -52 46Z", P.p, 'opacity="0.9"') + rect(-26, -78, 52, 12, 6, P.dark) + circle(-12, 46, 5, "#fff") + circle(10, 40, 4, "#fff") + circle(20, 52, 3, "#fff"), "translate(450 160) rotate(8)", 'filter="url(#sh)"') +
      [0, 1, 2, 3, 4].map((i) => g(path("M0 -14L4 -4L15 -4L6 3L9 14L0 7L-9 14L-6 3L-15 -4L-4 -4Z", i < 4 ? P.s : "#ffffff", i < 4 ? "" : 'opacity="0.5"'), `translate(${392 + i * 34} 276)`)).join("") +
      g(path("M0 0H100L88 22L100 44H0Z", P.t), "translate(378 70) rotate(-6)", 'filter="url(#sh2)"')
    );
  },

  market: (P) => {
    const awning = (x: number, c1: string, c2: string) =>
      g([0, 1, 2, 3, 4].map((i) => path(`M${i * 30} 0H${i * 30 + 30}L${i * 30 + 30} 24Q${i * 30 + 15} 38 ${i * 30} 24Z`, i % 2 ? c2 : c1)).join("") + rect(0, -22, 150, 22, 6, c1) + rect(6, 36, 6, 128, 3, P.dark, 'opacity="0.55"') + rect(138, 36, 6, 128, 3, P.dark, 'opacity="0.55"') + rect(-4, 130, 158, 14, 5, P.s === "#7a4b2e" ? "#a8744a" : P.s) + circle(40, 118, 14, P.t) + circle(70, 112, 12, P.p) + rect(92, 100, 34, 30, 6, "#fff") + circle(112, 90, 10, P.t), `translate(${x} 98)`, 'filter="url(#sh2)"');
    return `${rect(0, 290, W, 70, 0, P.dark, 'opacity="0.10"')}
     ${stroke("M0 40Q160 90 320 40T640 40", P.dark, 3, 'opacity="0.5"')}
     ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => path(`M${i * 80 + 30} ${55 + (i % 2) * 2}h28l-14 30Z`, [P.p, P.t, P.s, "#fff"][i % 4])).join("")}
     ${awning(40, P.p, "#ffffff")}${awning(246, P.t, "#ffffff")}${awning(440, P.s, "#ffffff")}
     ${circle(580, 100, 22, "#fff7d6", 'opacity="0.0"')}`;
  },

  study: (P) =>
    `${rect(0, 292, W, 68, 0, P.dark, 'opacity="0.08"')}
     ${g(rect(-170, -112, 340, 214, 14, P.dark) + rect(-158, -100, 316, 190, 8, "#ffffff") + [0, 1, 2, 3].map((i) => {
       const x = -146 + (i % 2) * 150;
       const y = -88 + Math.floor(i / 2) * 90;
       return rect(x, y, 142, 82, 8, [P.bg[0], P.bg[1], "#f3f4f7", P.bg[0]][i]) + circle(x + 71, y + 32, 15, [P.p, P.s, P.t, P.p][i]) + path(`M${x + 38} ${y + 82}C${x + 38} ${y + 50} ${x + 104} ${y + 50} ${x + 104} ${y + 82}Z`, [P.p, P.s, P.t, P.p][i]);
     }).join("") + path("M-190 102H190L170 122H-170Z", "#c4cad6"), "translate(290 168)", 'filter="url(#sh)"')}
     ${g(rect(0, 0, 130, 30, 5, P.p) + rect(8, -28, 114, 28, 5, P.s) + rect(16, -54, 98, 26, 5, P.t) + lines(16, 10, [80], 0, "#fff", 5, 0.8), "translate(470 228)", 'filter="url(#sh2)"')}
     ${g(path("M0 0H44L40 54Q39 64 30 64H14Q5 64 4 54Z", "#fff") + path("M44 10Q64 10 62 30Q60 46 42 44", "none", 'stroke="#fff" stroke-width="7" stroke-linecap="round"') + stroke("M14 -8Q8 -22 16 -32", "#fff", 4, 'opacity="0.8"') + stroke("M28 -8Q22 -22 30 -32", "#fff", 4, 'opacity="0.8"'), "translate(548 250)", 'filter="url(#sh2)"')}
     ${star4(560, 80, 13, "#fff")}`,

  interview: (P) =>
    `${g(rect(-34, -90, 68, 120, 34, P.dark) + rect(-34, -90, 68, 120, 34, "#fff", 'opacity="0.1"') + [-60, -40, -20, 0, 20].map((y) => line(-24, y, 24, y, "#fff", 3, 'opacity="0.35"')).join("") + path("M-58 -20Q-58 52 0 52Q58 52 58 -20", "none", `stroke="${P.dark}" stroke-width="10" stroke-linecap="round"`) + line(0, 52, 0, 96, P.dark, 10) + rect(-40, 94, 80, 12, 6, P.dark), "translate(210 150)", 'filter="url(#sh)"')}
     ${g(rect(0, 0, 200, 86, 24, "#ffffff") + path("M24 86L12 116L58 86Z", "#ffffff") + lines(22, 22, [140, 100], 24, P.dark, 9, 0.35), "translate(330 50) rotate(2)", 'filter="url(#sh)"')}
     ${g(rect(0, 0, 190, 78, 24, P.p) + path("M170 78L184 106L136 78Z", P.p) + lines(22, 20, [130, 90], 22, "#fff", 9, 0.9), "translate(360 176) rotate(-2)", 'filter="url(#sh)"')}
     ${heart(580, 284, 12, P.t)}${star4(90, 70, 13, P.s)}${star4(540, 40, 9, "#fff")}${circle(320, 300, 7, "#fff", 'opacity="0.6"')}${circle(344, 300, 7, "#fff", 'opacity="0.4"')}${circle(368, 300, 7, "#fff", 'opacity="0.25"')}`,

  portfolio: (P) => {
    const cardArt = (c: string, shape: number) =>
      `${rect(0, 0, 170, 220, 16, "#fff")}${rect(12, 12, 146, 118, 10, c)}${shape === 0 ? circle(85, 70, 30, "#fff", 'opacity="0.75"') : shape === 1 ? path("M12 130V100L56 56L94 96L116 76L158 130Z", "#fff", 'opacity="0.7"') : rect(46, 40, 78, 62, 10, "#fff", 'opacity="0.75"')}${lines(12, 148, [110, 140, 90], 20, P.dark, 6, 0.25)}`;
    return `${g(cardArt(P.t, 1), "translate(150 80) rotate(-12)", 'filter="url(#sh)"')}${g(cardArt(P.s, 2), "translate(380 78) rotate(12)", 'filter="url(#sh)"')}${g(cardArt(P.p, 0), "translate(262 58)", 'filter="url(#sh)"')}
     ${g(path("M0 0L16 -50L30 -46L22 6Z", P.dark) + path("M0 0L-4 14L10 8Z", "#f5c518"), "translate(560 270) rotate(20)")}
     ${star4(100, 80, 14, "#fff")}${star4(560, 80, 12, P.p)}${heart(100, 290, 12, P.t)}`;
  },

  newsletter: (P) =>
    `${ellipse(320, 306, 180, 16, P.dark, 'opacity="0.16"')}
     ${g(path("M-130 -50L0 -140L130 -50V90Q130 106 114 106H-114Q-130 106 -130 90Z", P.p) + rect(-100, -96, 200, 160, 12, "#ffffff") + lines(-76, -66, [150, 112, 132, 90], 26, P.dark, 9, 0.28) + rect(-76, 22, 54, 20, 10, P.t) + path("M-130 -50L0 40L130 -50V92Q130 106 114 106H-114Q-130 106 -130 92Z", P.p) + path("M-130 92L-30 12M130 92L30 12", "none", 'stroke="#fff" stroke-opacity="0.35" stroke-width="4"'), "translate(300 190)", 'filter="url(#sh)"')}
     ${g(path("M0 0L120 -50L80 60L56 22L0 0Z", "#ffffff") + path("M56 22L120 -50L28 8Z", "#e5e9f2"), "translate(450 70) rotate(-10) scale(0.85)", 'filter="url(#sh2)"')}
     ${stroke("M430 120Q380 150 400 180", P.dark, 3, 'stroke-dasharray="2 8" opacity="0.5"')}
     ${circle(176, 92, 18, P.t, 'filter="url(#sh2)"')}${rect(172, 84, 8, 12, 4, "#fff")}${circle(176, 102, 2.5, "#fff")}
     ${star4(560, 270, 14, "#fff")}${star4(90, 270, 10, P.s)}`,

  team: (P) => {
    const person = (x: number, y: number, c: string, s: number) =>
      g(circle(0, -34, 24, "#ffe0c2") + path("M-40 40C-40 -4 -24 -10 0 -10C24 -10 40 -4 40 40Z", c) + path("M-24 -44C-24 -66 24 -66 24 -44C14 -52 -14 -52 -24 -44Z", P.dark, 'opacity="0.8"') + circle(-8, -32, 2.5, P.dark) + circle(8, -32, 2.5, P.dark) + stroke("M-6 -22Q0 -17 6 -22", P.dark, 2.5), `translate(${x} ${y}) scale(${s})`, 'filter="url(#sh2)"');
    return `${stroke("M170 190L320 130L470 190M170 190L320 270L470 190M320 130V270", P.dark, 3, 'stroke-dasharray="2 9" opacity="0.45"')}
     ${person(320, 150, P.p, 1.35)}${person(160, 220, P.s, 1)}${person(480, 220, P.t, 1)}${person(250, 290, P.s === "#7a4b2e" ? "#a8744a" : "#ffffff", 0.8)}${person(400, 290, "#ffffff", 0.8)}
     ${g(path("M0 0H34V12Q46 12 46 24T34 36V48H0V36Q-12 36 -12 24T0 12Z", P.s), "translate(300 36) rotate(-6)", 'filter="url(#sh2)"')}
     ${star4(560, 80, 14, "#fff")}${star4(80, 100, 11, "#fff")}${heart(560, 290, 11, P.t)}`;
  },

  open: (P) =>
    `${rect(0, 300, W, 60, 0, P.dark, 'opacity="0.12"')}
     ${g(rect(0, 0, 360, 190, 14, "#ffffff") + rect(18, 70, 324, 120, 8, P.bg[0], 'opacity="0.7"') + rect(34, 96, 100, 94, 6, P.dark, 'opacity="0.75"') + circle(118, 148, 4, P.s) + rect(158, 92, 164, 66, 8, "#ffffff", 'opacity="0.85"') + lines(170, 106, [110, 80], 22, P.dark, 7, 0.25)
        + [0, 1, 2, 3, 4, 5].map((i) => path(`M${i * 60} 0H${i * 60 + 60}L${i * 60 + 60} 44Q${i * 60 + 30} 62 ${i * 60} 44Z`, i % 2 ? "#ffffff" : P.p)).join(""),
       "translate(140 80)",
       'filter="url(#sh)"',
     )}
     ${g(line(0, -26, 0, 0, P.dark, 3) + rect(-52, 0, 104, 54, 10, P.s) + rect(-44, 8, 88, 38, 6, "#fff", 'opacity="0.85"') + lines(-30, 20, [60], 0, P.dark, 8, 0.7), "translate(540 70) rotate(4)", 'filter="url(#sh2)"')}
     ${g(path("M0 0C-30 -20 -26 -60 0 -60C26 -60 30 -20 0 0Z", P.t) + line(0, 0, 4, 60, P.dark, 2, 'opacity="0.5"'), "translate(90 120)", "")}${g(path("M0 0C-26 -18 -22 -52 0 -52C22 -52 26 -18 0 0Z", P.p) + line(0, 0, -4, 50, P.dark, 2, 'opacity="0.5"'), "translate(560 200)", "")}
     ${[[60, 250, P.s], [100, 290, P.t], [520, 270, P.p], [590, 300, P.s], [30, 180, "#fff"], [610, 140, "#fff"]].map(([x, y, c], i) => rect(x as number, y as number, 10, 5, 2, c as string, `transform="rotate(${i * 50} ${x} ${y})"`)).join("")}
     ${star4(300, 50, 12, "#fff")}`,
};

// 카테고리 기본 이미지에서 쓰는 단순 구도
const DEFAULT_MOTIFS: Record<string, { motif: string; palette: number }> = {
  apps: { motif: "phone-translate", palette: 5 },
  websites: { motif: "browser-portfolio", palette: 11 },
  services: { motif: "service-consult", palette: 10 },
  offline: { motif: "cafe", palette: 5 },
  products: { motif: "organizer", palette: 7 },
  content: { motif: "shorts", palette: 12 },
  events: { motif: "market", palette: 9 },
  free: { motif: "portfolio", palette: 5 },
};

function render(motifKey: string, paletteIndex: number, seed: number): string {
  const P = PALETTES[paletteIndex % PALETTES.length];
  const fn = motifs[motifKey];
  if (!fn) throw new Error(`unknown motif: ${motifKey}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.bg[0]}"/><stop offset="1" stop-color="${P.bg[1]}"/></linearGradient>
${SHADOW}
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${backdrop(P, seed)}
${fn(P)}
</svg>
`;
}

const root = process.cwd();
const seedDir = resolve(root, "public", "seed");
const defaultDir = resolve(root, "public", "defaults");
mkdirSync(seedDir, { recursive: true });
mkdirSync(defaultDir, { recursive: true });

for (const post of SEED_POSTS) {
  const file = resolve(seedDir, `${String(post.id).padStart(2, "0")}.svg`);
  writeFileSync(file, render(post.motif, post.palette, post.id));
}
for (const [slug, d] of Object.entries(DEFAULT_MOTIFS)) {
  writeFileSync(resolve(defaultDir, `${slug}.svg`), render(d.motif, d.palette, 900 + slug.length));
}
console.log(`generated ${SEED_POSTS.length} seed images + ${Object.keys(DEFAULT_MOTIFS).length} default images`);
