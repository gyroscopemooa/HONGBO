export const PLAY_TAG = "놀러가자";
export const PLAY_KINDS = ["명소·산책", "축제·행사", "테마파크", "체험·놀거리", "숙소"] as const;
export const PLAY_COMPANIONS = ["데이트", "아이와", "친구와", "혼자"] as const;
export type PlayKind = typeof PLAY_KINDS[number];
export type PlayCompanion = typeof PLAY_COMPANIONS[number];
export type PlayPlace = {
  slug: string; title: string; region: string; area: string; kind: PlayKind;
  companions: PlayCompanion[]; summary: string; mood: string; art: "sea" | "village" | "train" | "park" | "fireworks" | "stay";
  price: string; address: string; tips: string[]; source: string; sourceLabel: string;
  checkedAt: string; startDate?: string; endDate?: string; benefitUrl?: string;
};

export const PLAY_PERIOD_NOTE = "일정·기간";
export function validPlayDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
export function playDateLabel(value: string): string {
  if (!validPlayDate(value)) return "일정 확인 필요";
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "Asia/Seoul" }).format(new Date(`${value}T00:00:00+09:00`));
  return `${value.replaceAll("-", ".")} (${weekday})`;
}
export function playPeriod(place: Pick<PlayPlace, "startDate" | "endDate">): string {
  if (place.startDate && place.endDate && place.startDate !== place.endDate) return `${playDateLabel(place.startDate)} ~ ${playDateLabel(place.endDate)}`;
  if (place.startDate) return playDateLabel(place.startDate);
  if (place.endDate) return `~ ${playDateLabel(place.endDate)}`;
  return "상시 장소 안내 · 방문일 운영 확인";
}

/** Date-only event boundaries are Korean calendar days, inclusive of the last day. */
export function koreanDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function playStatus(place: Pick<PlayPlace, "startDate" | "endDate">, day = koreanDay()) {
  if (place.endDate && place.endDate < day) return "종료";
  if (place.startDate && place.startDate > day) return "예정";
  return place.startDate ? "진행 중" : "상시 안내";
}
export function filterPlayPlaces(places: PlayPlace[], filters: { q?: string; region?: string; kind?: string; companion?: string; ended?: boolean }, day = koreanDay()) {
  const words = (filters.q ?? "").toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return places.filter(p => (filters.ended || playStatus(p, day) !== "종료")
    && (!filters.region || p.region === filters.region)
    && (!filters.kind || p.kind === filters.kind)
    && (!filters.companion || p.companions.some(c => c === filters.companion))
    && words.every(w => `${p.title} ${p.region} ${p.area} ${p.kind} ${p.summary} ${p.companions.join(" ")}`.toLocaleLowerCase().includes(w)));
}
