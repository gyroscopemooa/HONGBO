export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function relativeTime(iso: string | Date, now: Date = new Date()): string {
  const t = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Math.max(0, now.getTime() - t.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}개월 전`;
  return `${Math.floor(month / 12)}년 전`;
}

/** 지금부터 해당 시각까지 남은 일수(올림) */
export function daysUntil(iso: string | Date): number {
  const t = typeof iso === "string" ? new Date(iso) : iso;
  return Math.ceil((t.getTime() - Date.now()) / 86_400_000);
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "")}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}천`;
  return String(n);
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function pickFirst(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parsePositiveInt(v: string | string[] | undefined, fallback = 1): number {
  const n = Number.parseInt(pickFirst(v) ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** 검색어 정리 — 공백 정규화 및 길이 제한 */
export function cleanQuery(v: string | string[] | undefined, max = 60): string {
  return (pickFirst(v) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thehongbo.com";
  return raw.replace(/\/+$/, "");
}
