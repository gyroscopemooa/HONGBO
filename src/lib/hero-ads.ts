import { findBannedKeyword } from "./policy";
import { isAllowedImageUrl, normalizeExternalUrl } from "./url";

/** 홈 대형 슬라이드(Hero) 광고 — 동시에 노출 가능한 수 */
export const HERO_AD_SLOTS = 3;

export const HERO_PLANS = {
  week: { label: "1주일", days: 7 },
  month: { label: "1개월", days: 30 },
} as const;

/** 가격(원) — 상단 와이드 배너(주 50,000 / 월 100,000)보다 낮게, 프리미엄 고정(주 30,000 / 월 50,000)보다 높게 잡았어요. */
export const HERO_PRICES: Record<HeroPlan, number> = { week: 40_000, month: 90_000 };
/** 운영자가 디자인을 대신 만들어 드릴 때 협의하는 기준 추가 비용 */
export const HERO_DESIGN_FEE = 30_000;

export type HeroPlan = keyof typeof HERO_PLANS;
export type HeroDesignMode = "template" | "image" | "discuss";
export type HeroLinkMode = "url" | "discuss";
export type HeroTheme = "violet" | "blue" | "mint" | "coral" | "dark";

export const HERO_THEMES: Array<{ value: HeroTheme; label: string; bg: string; ink: string; sub: string; btn: string }> = [
  { value: "violet", label: "보라", bg: "linear-gradient(120deg,#f1ecff 0%,#d9cffa 100%)", ink: "#3b2399", sub: "#5d4b9c", btn: "#5b3fc4" },
  { value: "blue", label: "파랑", bg: "linear-gradient(120deg,#e8f3ff 0%,#c4def9 100%)", ink: "#12427a", sub: "#365f8f", btn: "#1f6fd1" },
  { value: "mint", label: "민트", bg: "linear-gradient(120deg,#e6f9f1 0%,#bfeedb 100%)", ink: "#0b5d49", sub: "#2f7a67", btn: "#0e8a6c" },
  { value: "coral", label: "코랄", bg: "linear-gradient(120deg,#fff0ec 0%,#ffd0c6 100%)", ink: "#9a2b1a", sub: "#b0503f", btn: "#e2523a" },
  { value: "dark", label: "어두운", bg: "linear-gradient(120deg,#23233a 0%,#3b3b63 100%)", ink: "#ffffff", sub: "#d4d4ee", btn: "#7c6cf0" },
];
export const heroTheme = (v: string | null | undefined) => HERO_THEMES.find((t) => t.value === v) ?? HERO_THEMES[0];

export const HERO_LIMITS = { title: 40, subtitle: 80, button: 16, memo: 500, advertiser: 60 } as const;

export interface HeroAd {
  id: number;
  requestedBy: string | null;
  plan: HeroPlan;
  status: "requested" | "active";
  designMode: HeroDesignMode;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  theme: HeroTheme;
  imageUrl: string | null;
  linkMode: HeroLinkMode;
  linkUrl: string | null;
  memo: string | null;
  advertiser: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export const heroPrice = (plan: HeroPlan) => HERO_PRICES[plan];
/** 입금자명 — 일반 광고(더홍보N)와 겹치지 않게 H를 붙여요. */
export const heroDepositor = (id: number) => `더홍보H${id}`;

export function isHeroLive(a: Pick<HeroAd, "status" | "startsAt" | "endsAt">, now = Date.now()): boolean {
  return a.status === "active" && !!a.startsAt && !!a.endsAt && new Date(a.startsAt).getTime() <= now && new Date(a.endsAt).getTime() > now;
}

export function heroEndsAt(plan: HeroPlan, from = new Date()): string {
  return new Date(from.getTime() + HERO_PLANS[plan].days * 86_400_000).toISOString();
}

export interface HeroAdInput {
  plan: HeroPlan;
  designMode: HeroDesignMode;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  theme: HeroTheme;
  imageUrl: string | null;
  linkMode: HeroLinkMode;
  linkUrl: string | null;
  memo: string | null;
  advertiser: string | null;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export type HeroParse = { ok: true; data: HeroAdInput } | { ok: false; error: string };

/** 폼 입력을 서버에서 다시 검증합니다. */
export function parseHeroAdInput(get: (k: string) => string): HeroParse {
  const plan = get("plan");
  if (plan !== "week" && plan !== "month") return { ok: false, error: "기간을 선택해주세요." };
  const designMode = get("designMode");
  if (designMode !== "template" && designMode !== "image" && designMode !== "discuss") return { ok: false, error: "배너 제작 방식을 선택해주세요." };
  const linkMode = get("linkMode");
  if (linkMode !== "url" && linkMode !== "discuss") return { ok: false, error: "링크 방식을 선택해주세요." };

  const advertiser = clean(get("advertiser"), HERO_LIMITS.advertiser) || null;
  const memo = String(get("memo") ?? "").replace(/\r\n/g, "\n").trim().slice(0, HERO_LIMITS.memo) || null;
  const themeRaw = get("theme");
  const theme: HeroTheme = HERO_THEMES.some((t) => t.value === themeRaw) ? (themeRaw as HeroTheme) : "violet";

  let title: string | null = null;
  let subtitle: string | null = null;
  let buttonText: string | null = null;
  let imageUrl: string | null = null;

  if (designMode === "template") {
    title = clean(get("title"), HERO_LIMITS.title) || null;
    subtitle = clean(get("subtitle"), HERO_LIMITS.subtitle) || null;
    buttonText = clean(get("buttonText"), HERO_LIMITS.button) || null;
    if (!title) return { ok: false, error: "배너 제목을 입력해주세요." };
  } else if (designMode === "image") {
    imageUrl = get("imageUrl").trim() || null;
    if (!imageUrl) return { ok: false, error: "배너 이미지를 올려주세요." };
    if (!isAllowedImageUrl(imageUrl)) return { ok: false, error: "이미지를 다시 올려주세요." };
  } else if (!memo) {
    return { ok: false, error: "협의할 내용(원하는 분위기, 문구, 자료 등)을 간단히 적어주세요." };
  }

  let linkUrl: string | null = null;
  if (linkMode === "url") {
    const r = normalizeExternalUrl(get("linkUrl").trim());
    if (!r.ok) return { ok: false, error: r.error ?? "연결할 링크를 확인해주세요." };
    linkUrl = r.url ?? null;
  }

  if (findBannedKeyword(title ?? "", subtitle ?? "", buttonText ?? "", memo ?? "", advertiser ?? "")) {
    return { ok: false, error: "운영정책상 사용할 수 없는 문구가 포함되어 있어요." };
  }
  return { ok: true, data: { plan, designMode, title, subtitle, buttonText, theme, imageUrl, linkMode, linkUrl, memo, advertiser } };
}
