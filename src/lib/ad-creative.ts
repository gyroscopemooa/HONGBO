import { findBannedKeyword } from "./policy";
import type { Ad, AdCreative, Post } from "./types";
import { isAllowedImageUrl } from "./url";

export const CREATIVE_TITLE_MAX = 30;
export const CREATIVE_SUBTITLE_MAX = 50;

type Result = { ok: true; creative: AdCreative | null } | { ok: false; error: string };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/**
 * 폼에서 넘어온 광고 제작 정보를 서버에서 다시 검증합니다. 비어 있거나 자동(기존 글 그대로)이면 null.
 * - 배너: custom(사진·문구 직접) / upload(완성 이미지)
 * - 프리미엄(카드): custom(새 이미지·문구)만 — 이미지는 16:9 카드용
 */
export function parseCreative(raw: string | null | undefined, kind: Ad["kind"]): Result {
  if (!raw) return { ok: true, creative: null };
  let v: Record<string, unknown>;
  try {
    v = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "광고 제작 정보를 확인해주세요." };
  }
  if (v.mode !== "upload" && v.mode !== "custom") return { ok: true, creative: null };
  if (kind === "premium" && v.mode !== "custom") return { ok: true, creative: null };

  const imageUrl = typeof v.imageUrl === "string" ? v.imageUrl.trim() : "";
  if (imageUrl && !isAllowedImageUrl(imageUrl)) return { ok: false, error: "이미지를 다시 올려주세요." };

  if (v.mode === "upload") {
    if (!imageUrl) return { ok: false, error: "배너 이미지를 올려주세요." };
    return { ok: true, creative: { mode: "upload", imageUrl } };
  }

  const title = clean(v.title, CREATIVE_TITLE_MAX);
  const subtitle = clean(v.subtitle, CREATIVE_SUBTITLE_MAX);
  if (findBannedKeyword(title, subtitle)) return { ok: false, error: "운영정책상 사용할 수 없는 문구가 포함되어 있어요." };
  if (!imageUrl && !title && !subtitle) return { ok: true, creative: null };
  const creative: AdCreative = { mode: "custom", ...(imageUrl ? { imageUrl } : {}), ...(title ? { title } : {}), ...(subtitle ? { subtitle } : {}) };
  if (kind === "banner") creative.tone = v.tone === "light" ? "light" : "dark";
  return { ok: true, creative };
}

/** 프리미엄 카드에 직접 정한 이미지·문구를 덮어씌운 글 (링크는 원래 글 그대로) */
export function applyPremiumCreative<T extends Pick<Post, "title" | "shortDescription" | "primaryImageUrl">>(post: T, creative?: AdCreative | null): T {
  if (!creative || creative.mode !== "custom") return post;
  return {
    ...post,
    primaryImageUrl: creative.imageUrl || post.primaryImageUrl,
    title: creative.title || post.title,
    shortDescription: creative.subtitle || post.shortDescription,
  };
}
