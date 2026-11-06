import { findBannedKeyword } from "./policy";
import { isBlockedHostname, isAllowedImageUrl, normalizeExternalUrl } from "./url";
import { parseYoutubeId } from "./youtube";

/** 후기 카테고리 — 업체·서비스 종류별로 세분화하고, 마지막은 자유(기타) */
export const REVIEW_CATEGORIES = [
  { value: "app", label: "앱·게임" },
  { value: "web", label: "웹사이트·플랫폼" },
  { value: "service", label: "서비스·대행" },
  { value: "food", label: "음식점·카페" },
  { value: "beauty", label: "뷰티·미용" },
  { value: "health", label: "병원·건강·운동" },
  { value: "shopping", label: "쇼핑·상품" },
  { value: "edu", label: "교육·학원" },
  { value: "travel", label: "숙박·여행·레저" },
  { value: "living", label: "생활·인테리어·시공" },
  { value: "design", label: "제작·디자인·마케팅" },
  { value: "rental", label: "렌탈·구독" },
  { value: "car", label: "자동차·정비" },
  { value: "etc", label: "기타·자유" },
] as const;

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number]["value"];
export const REVIEW_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(REVIEW_CATEGORIES.map((c) => [c.value, c.label]));
export const isReviewCategory = (v: unknown): v is ReviewCategory => typeof v === "string" && v in REVIEW_CATEGORY_LABEL;

export const REVIEW_LIMITS = {
  targetMin: 2,
  targetMax: 60,
  titleMin: 2,
  titleMax: 80,
  bodyMin: 10,
  bodyMax: 3000,
  imagesMax: 4,
  linksMax: 5,
} as const;

export const REVIEW_REPORT_REASONS: Record<string, string> = {
  false: "허위·과장 후기",
  defame: "비방·욕설",
  ad: "광고·홍보성 글",
  privacy: "개인정보 노출",
  other: "기타",
};

export interface Review {
  id: number;
  authorId: string | null;
  nickname: string;
  category: string;
  targetName: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  youtubeId: string | null;
  targetUrl: string | null;
  createdAt: string;
}

export interface ReviewInput {
  category: string;
  targetName: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  videoUrl: string;
  targetUrl: string;
}

export interface CleanReview {
  category: ReviewCategory;
  targetName: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  youtubeId: string | null;
  targetUrl: string | null;
}

/** 본문에서 http(s) 링크를 찾아 조각으로 나눕니다. 위험한 주소(내부망 등)는 링크로 만들지 않습니다. */
export type BodyPart = { type: "text"; text: string } | { type: "link"; url: string; text: string };

const URL_RE = /https?:\/\/[^\s<>"'`]+/gi;
const TRAILING = /[.,!?;:)\]}>』」”’]+$/;

export function splitBody(body: string): BodyPart[] {
  const parts: BodyPart[] = [];
  let last = 0;
  for (const m of body.matchAll(URL_RE)) {
    const start = m.index ?? 0;
    let raw = m[0];
    const trail = raw.match(TRAILING)?.[0] ?? "";
    if (trail) raw = raw.slice(0, raw.length - trail.length);
    let ok = false;
    try {
      const u = new URL(raw);
      ok = (u.protocol === "http:" || u.protocol === "https:") && !u.username && !u.password && !isBlockedHostname(u.hostname) && raw.length <= 2000;
    } catch {
      ok = false;
    }
    if (start > last) parts.push({ type: "text", text: body.slice(last, start) });
    if (ok) parts.push({ type: "link", url: raw, text: raw });
    else parts.push({ type: "text", text: raw });
    if (trail) parts.push({ type: "text", text: trail });
    last = start + m[0].length;
  }
  if (last < body.length) parts.push({ type: "text", text: body.slice(last) });
  return parts;
}

export const countBodyLinks = (body: string) => splitBody(body).filter((p) => p.type === "link").length;

export type ReviewParse = { ok: true; data: CleanReview } | { ok: false; message: string };

export function parseReviewInput(raw: ReviewInput): ReviewParse {
  const category = raw.category;
  if (!isReviewCategory(category)) return { ok: false, message: "후기 종류를 선택해주세요." };
  const targetName = String(raw.targetName ?? "").replace(/\s+/g, " ").trim();
  if (targetName.length < REVIEW_LIMITS.targetMin) return { ok: false, message: "후기를 남길 업체·서비스 이름을 입력해주세요." };
  if (targetName.length > REVIEW_LIMITS.targetMax) return { ok: false, message: `업체·서비스 이름은 ${REVIEW_LIMITS.targetMax}자까지 입력할 수 있어요.` };
  const rating = Number(raw.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, message: "별점을 선택해주세요." };
  const title = String(raw.title ?? "").replace(/\s+/g, " ").trim();
  if (title.length < REVIEW_LIMITS.titleMin) return { ok: false, message: "제목을 2자 이상 입력해주세요." };
  if (title.length > REVIEW_LIMITS.titleMax) return { ok: false, message: `제목은 ${REVIEW_LIMITS.titleMax}자까지 입력할 수 있어요.` };
  const body = String(raw.body ?? "").replace(/\r\n/g, "\n").trim();
  if (body.length < REVIEW_LIMITS.bodyMin) return { ok: false, message: `후기 내용을 ${REVIEW_LIMITS.bodyMin}자 이상 적어주세요.` };
  if (body.length > REVIEW_LIMITS.bodyMax) return { ok: false, message: `후기 내용은 ${REVIEW_LIMITS.bodyMax.toLocaleString()}자까지 입력할 수 있어요.` };
  if (countBodyLinks(body) > REVIEW_LIMITS.linksMax) return { ok: false, message: `본문 링크는 ${REVIEW_LIMITS.linksMax}개까지 넣을 수 있어요.` };

  const images = Array.isArray(raw.images) ? raw.images.filter((u) => typeof u === "string") : [];
  if (images.length > REVIEW_LIMITS.imagesMax) return { ok: false, message: `사진은 ${REVIEW_LIMITS.imagesMax}장까지 올릴 수 있어요.` };
  if (images.some((u) => !isAllowedImageUrl(u))) return { ok: false, message: "허용되지 않는 이미지 주소가 있어요. 사진을 다시 올려주세요." };
  if (new Set(images).size !== images.length) return { ok: false, message: "같은 사진이 중복으로 들어 있어요." };

  let youtubeId: string | null = null;
  const video = String(raw.videoUrl ?? "").trim();
  if (video) {
    youtubeId = parseYoutubeId(video);
    if (!youtubeId) return { ok: false, message: "영상은 유튜브 주소만 넣을 수 있어요. 다른 영상은 본문에 링크로 적어주세요." };
  }

  let targetUrl: string | null = null;
  const link = String(raw.targetUrl ?? "").trim();
  if (link) {
    const r = normalizeExternalUrl(link);
    if (!r.ok) return { ok: false, message: r.error ?? "업체 링크를 확인해주세요." };
    targetUrl = r.url ?? null;
  }

  if (findBannedKeyword(targetName, title, body)) return { ok: false, message: "운영정책상 올릴 수 없는 내용이 포함되어 있어요. 내용을 확인해주세요." };

  return { ok: true, data: { category, targetName, rating, title, body, images, youtubeId, targetUrl } };
}
