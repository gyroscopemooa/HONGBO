import { findBannedKeyword } from "./policy";
import type { Ad, AdCreative } from "./types";
import { isAllowedImageUrl } from "./url";

export const CREATIVE_TITLE_MAX = 30;
export const CREATIVE_SUBTITLE_MAX = 50;

type Result = { ok: true; creative: AdCreative | null } | { ok: false; error: string };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** 폼에서 넘어온 배너 제작 정보를 서버에서 다시 검증합니다. 배너가 아니거나 자동 제작이면 null. */
export function parseCreative(raw: string | null | undefined, kind: Ad["kind"]): Result {
  if (kind !== "banner" || !raw) return { ok: true, creative: null };
  let v: Record<string, unknown>;
  try {
    v = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "배너 제작 정보를 확인해주세요." };
  }
  if (v.mode !== "upload" && v.mode !== "custom") return { ok: true, creative: null };

  const imageUrl = typeof v.imageUrl === "string" ? v.imageUrl.trim() : "";
  if (imageUrl && !isAllowedImageUrl(imageUrl)) return { ok: false, error: "배너 이미지를 다시 올려주세요." };

  if (v.mode === "upload") {
    if (!imageUrl) return { ok: false, error: "배너 이미지를 올려주세요." };
    return { ok: true, creative: { mode: "upload", imageUrl } };
  }

  const title = clean(v.title, CREATIVE_TITLE_MAX);
  const subtitle = clean(v.subtitle, CREATIVE_SUBTITLE_MAX);
  if (findBannedKeyword(title, subtitle)) return { ok: false, error: "운영정책상 사용할 수 없는 문구가 포함되어 있어요." };
  const tone = v.tone === "light" ? "light" : "dark";
  return {
    ok: true,
    creative: { mode: "custom", ...(imageUrl ? { imageUrl } : {}), ...(title ? { title } : {}), ...(subtitle ? { subtitle } : {}), tone },
  };
}
