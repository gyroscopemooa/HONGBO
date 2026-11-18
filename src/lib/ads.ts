import type { Ad } from "./types";

/** 프리미엄 상단 광고 칸 수 (처음엔 3칸만 공개) */
export const AD_PREMIUM_SLOTS = 3;
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

/** 입금 계좌 (신청 직후 화면과 내 신청 내역에 그대로 안내됩니다) */
export const AD_BANK = { bank: "토스뱅크", number: "1002-4689-8286", holder: "전민수(자이로스코프)" } as const;
/** 미입금 시 신청이 취소될 수 있는 기간(일) */
export const AD_PAY_DAYS = 3;

/** 입금자명 — 신청 번호가 붙어 입금 내역에서 바로 찾을 수 있어요. */
export const depositorName = (adId: number) => `더홍보${adId}`;
export const adPrice = (a: Pick<Ad, "kind" | "plan">) => AD_PRICES[a.kind][a.plan];

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

/**
 * 운영자 고정 광고 — 유료 광고 자리가 남아 있을 때 프리미엄·배너 맨 앞에 "광고"로 표시해 노출합니다.
 * 유료 광고가 3칸을 모두 채우면 자동으로 양보합니다. 글 번호는 운영 DB 기준이며, 글이 없으면 건너뜁니다.
 */
export const HOUSE_AD_POST_ID = 41;

/** 두 기간이 겹치는가 */
export const overlaps = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE;

/** 기간 안에서 동시에 노출될 프리미엄 광고의 최대 개수(겹치는 구간 기준) */
export function maxConcurrent(ranges: Array<{ s: number; e: number }>): number {
  const ev = ranges.flatMap((r) => [[r.s, 1], [r.e, -1]] as const).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  let cur = 0;
  let max = 0;
  for (const [, d] of ev) {
    cur += d;
    max = Math.max(max, cur);
  }
  return max;
}

/** 새 기간이 기존 프리미엄 광고와 겹쳐 동시 칸 수를 넘기는지 검사. 문제가 없으면 null */
export function premiumCapacityError(existing: Array<Pick<Ad, "startsAt" | "endsAt">>, startsAt: string, endsAt: string): string | null {
  const s = new Date(startsAt).getTime();
  const e = new Date(endsAt).getTime();
  const near = existing
    .filter((a) => a.startsAt && a.endsAt)
    .map((a) => ({ s: new Date(a.startsAt!).getTime(), e: new Date(a.endsAt!).getTime() }))
    .filter((r) => overlaps(r.s, r.e, s, e))
    .map((r) => ({ s: Math.max(r.s, s), e: Math.min(r.e, e) }));
  return maxConcurrent([...near, { s, e }]) > AD_PREMIUM_SLOTS ? `그 기간에 프리미엄 ${AD_PREMIUM_SLOTS}칸이 이미 모두 차 있어요. 기간을 바꿔주세요.` : null;
}

/** 승인됐지만 아직 시작 전인(예약된) 광고인가 */
export const isAdScheduled = (a: Pick<Ad, "status" | "startsAt">, now = Date.now()) =>
  a.status === "active" && !!a.startsAt && new Date(a.startsAt).getTime() > now;
