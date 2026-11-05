import type { Ad } from "./types";

/** 프리미엄 상단 칸 수 */
export const AD_PREMIUM_SLOTS = 10;
/** 와이드 배너 동시 노출 가능 수 (홈에서 로테이션) */
export const AD_BANNER_SLOTS = 3;

export const AD_PLANS = {
  week: { label: "1주일", days: 7 },
  month: { label: "1개월", days: 30 },
} as const;

/** 가격(원). 프리미엄: 주 30,000 / 월 50,000. 배너 가격은 임시값이므로 운영 전에 확정하세요. */
export const AD_PRICES: Record<Ad["kind"], Record<Ad["plan"], number>> = {
  premium: { week: 30_000, month: 50_000 },
  banner: { week: 50_000, month: 100_000 },
};

export const AD_KIND_LABEL: Record<Ad["kind"], string> = { premium: "프리미엄 상단 고정", banner: "와이드 배너" };

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function adEndsAt(plan: Ad["plan"], from = new Date()): string {
  return new Date(from.getTime() + AD_PLANS[plan].days * 86_400_000).toISOString();
}

/** 지금 노출 중인 광고인가 */
export function isAdLive(a: Pick<Ad, "status" | "startsAt" | "endsAt">, now = Date.now()): boolean {
  return (
    a.status === "active" &&
    !!a.startsAt &&
    !!a.endsAt &&
    new Date(a.startsAt).getTime() <= now &&
    new Date(a.endsAt).getTime() > now
  );
}

/** 사용 중이 아닌 가장 낮은 프리미엄 칸 번호. 모두 차 있으면 null */
export function nextFreeSlot(liveAds: Array<Pick<Ad, "kind" | "slotNo">>): number | null {
  const used = new Set(liveAds.filter((a) => a.kind === "premium" && a.slotNo != null).map((a) => a.slotNo));
  for (let i = 1; i <= AD_PREMIUM_SLOTS; i++) if (!used.has(i)) return i;
  return null;
}

/** 새로고침마다 순서를 섞어 모든 광고주가 앞자리를 고르게 나눠 갖게 합니다. */
export function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
