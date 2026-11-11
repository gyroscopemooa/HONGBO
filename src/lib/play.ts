export const PLAY_TAG = "놀러가자";
export const PLAY_KINDS = ["명소·산책", "축제·행사", "테마파크", "체험·놀거리", "숙소"] as const;
export const PLAY_COMPANIONS = ["데이트", "아이와", "친구와", "혼자"] as const;
export type PlayKind = typeof PLAY_KINDS[number];
export type PlayCompanion = typeof PLAY_COMPANIONS[number];
export type PlayPlace = {
  slug: string; title: string; region: string; area: string; kind: PlayKind;
  companions: PlayCompanion[]; summary: string; mood: string; art: "sea" | "village" | "train" | "park" | "fireworks" | "stay";
  price: string; address: string; tips: string[]; source: string; sourceLabel: string;
  guide?: string;
  schedulePending?: boolean; scheduleNote?: string;
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
export function playPeriod(place: Pick<PlayPlace, "startDate" | "endDate" | "schedulePending">): string {
  if (place.schedulePending) return `제공 일정(미확인) · ${playPeriod({...place, schedulePending:false})}`;
  if (place.startDate && place.endDate && place.startDate !== place.endDate) return `${playDateLabel(place.startDate)} ~ ${playDateLabel(place.endDate)}`;
  if (place.startDate) return playDateLabel(place.startDate);
  if (place.endDate) return `~ ${playDateLabel(place.endDate)}`;
  return "상시 장소 안내 · 방문일 운영 확인";
}

/** Date-only event boundaries are Korean calendar days, inclusive of the last day. */
export function koreanDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function playStatus(place: Pick<PlayPlace, "startDate" | "endDate" | "schedulePending">, day = koreanDay()) {
  if (place.schedulePending) return "일정 확인 중";
  if ((place.endDate || place.startDate) && (place.endDate || place.startDate)! < day) return "종료";
  if (place.startDate && place.startDate > day) return "예정";
  return place.startDate ? "진행 중" : "상시 안내";
}

export function playCountdown(place: Pick<PlayPlace, "startDate" | "endDate" | "schedulePending">, day = koreanDay()): string {
  const status = playStatus(place, day);
  if (status === "일정 확인 중") return status;
  if (status === "종료") return "지난 축제";
  if (!place.startDate) return status;
  const days = Math.round((Date.parse(`${place.startDate}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86400000);
  return days > 0 ? `D-${days}` : days === 0 ? "D-DAY · 오늘 시작" : "진행 중";
}

/** Active events first, then soonest start; archived events newest end first. Never mutates input. */
export function sortPlayPlaces(places: PlayPlace[], day = koreanDay()): PlayPlace[] {
  const rank = (p: PlayPlace) => ({"진행 중":0,"예정":1,"상시 안내":2,"일정 확인 중":3,"종료":4}[playStatus(p, day)]);
  return [...places].sort((a,b) => rank(a)-rank(b) || (rank(a) === 4
    ? (b.endDate || b.startDate || "").localeCompare(a.endDate || a.startDate || "")
    : rank(a) === 0 ? (a.endDate || a.startDate || "").localeCompare(b.endDate || b.startDate || "")
    : (a.startDate || "").localeCompare(b.startDate || "")));
}

export function playMonthLabel(month: string) { return `${month.slice(0,4)}년 ${Number(month.slice(5,7))}월`; }
/** Include a multi-month event in every month it overlaps, including year boundaries. */
export function playFestivalMonths(places: PlayPlace[], day = koreanDay(), archived = false) {
  const groups = new Map<string, PlayPlace[]>();
  const currentMonth = day.slice(0,7);
  for (const p of sortPlayPlaces(places, day)) {
    if (p.schedulePending || p.kind !== "축제·행사" || !p.startDate || !validPlayDate(p.startDate)) continue;
    if ((playStatus(p, day) === "종료") !== archived) continue;
    const end = p.endDate || p.startDate;
    if (!validPlayDate(end) || end < p.startDate) continue;
    let month = p.startDate.slice(0,7);
    if (!archived && month < currentMonth) month = currentMonth;
    while (month <= end.slice(0,7)) {
      groups.set(month, [...(groups.get(month) || []), p]);
      const [y,m] = month.split("-").map(Number);
      month = `${m === 12 ? y+1 : y}-${String(m === 12 ? 1 : m+1).padStart(2,"0")}`;
    }
  }
  return [...groups].sort(([a],[b]) => archived ? b.localeCompare(a) : a.localeCompare(b)).map(([month, items])=>({month,items}));
}
export function filterPlayPlaces(places: PlayPlace[], filters: { q?: string; region?: string; kind?: string; companion?: string; ended?: boolean }, day = koreanDay()) {
  const words = (filters.q ?? "").toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return places.filter(p => (filters.ended || playStatus(p, day) !== "종료")
    && (!filters.region || p.region === filters.region)
    && (!filters.kind || p.kind === filters.kind)
    && (!filters.companion || p.companions.some(c => c === filters.companion))
    && words.every(w => `${p.title} ${p.region} ${p.area} ${p.kind} ${p.summary} ${p.companions.join(" ")}`.toLocaleLowerCase().includes(w)));
}
