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
