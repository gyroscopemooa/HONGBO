import { CATEGORY_MAP, PLATFORM_LABELS } from "./constants";
import type { Post } from "./types";

/** 카테고리와 링크 종류에 따라 자동으로 정해지는 CTA 라벨 */
export function ctaLabel(post: Pick<Post, "category" | "externalUrl" | "mapUrl" | "extra">): string {
  switch (post.category) {
    case "apps":
      return post.extra.playUrl || post.extra.appStoreUrl ? "앱 설치하기" : "보러가기";
    case "offline":
      return post.mapUrl && post.externalUrl === post.mapUrl ? "지도에서 보기" : "매장 정보 보기";
    default:
      return CATEGORY_MAP[post.category].cta;
  }
}

export interface PostLink {
  label: string;
  url: string;
}

/** 대표 CTA 외에 함께 보여줄 보조 링크 */
export function secondaryLinks(post: Post): PostLink[] {
  const out: PostLink[] = [];
  const add = (label: string, url?: string | null) => {
    if (url && url !== post.externalUrl && !out.some((o) => o.url === url)) out.push({ label, url });
  };
  if (post.category === "apps") {
    add("Google Play", post.extra.playUrl);
    add("App Store", post.extra.appStoreUrl);
    add("공식 사이트", post.extra.siteUrl);
  }
  if (post.category === "offline") {
    add("지도에서 보기", post.mapUrl);
    add("영업/문의 링크", post.extra.businessUrl);
  }
  return out;
}

export function platformText(post: Pick<Post, "platform">): string | null {
  if (!post.platform) return null;
  return post.platform
    .split(",")
    .map((p) => PLATFORM_LABELS[p] ?? p)
    .join(" · ");
}
