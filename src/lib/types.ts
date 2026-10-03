import type { CategorySlug } from "./constants";

export type PostStatus = "active" | "hidden" | "blocked" | "expired" | "deleted";

/** 카테고리별로 필요한 추가 입력값. 카드에는 쓰이지 않고 상세 페이지에서만 사용합니다. */
export interface PostExtra {
  playUrl?: string;
  appStoreUrl?: string;
  siteUrl?: string;
  /** 서비스: online | offline | mixed */
  usageType?: string;
  /** 이벤트/모집 기간 (자유 텍스트) */
  period?: string;
  /** 오프라인 가게: 영업/문의 링크 */
  businessUrl?: string;
}

export interface Post {
  id: number;
  authorId: string | null;
  category: CategorySlug;
  title: string;
  shortDescription: string;
  description: string;
  primaryImageUrl: string | null;
  /** 추가 이미지(최대 4장) */
  images: string[];
  externalUrl: string;
  /** 앱: "android,ios" / 콘텐츠: "youtube" 등 */
  platform: string | null;
  price: string | null;
  region: string | null;
  address: string | null;
  mapUrl: string | null;
  tags: string[];
  extra: PostExtra;
  /** 작성자가 공개를 선택한 경우에만 값이 있습니다. */
  contact: string | null;
  status: PostStatus;
  adminPinned: boolean;
  curatedRank: number | null;
  isSeed: boolean;
  viewCount: number;
  clickCount: number;
  publishedAt: string;
  /** "다시 홍보하기"로 갱신된 시각 — 최신순 정렬 기준 */
  bumpedAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

/** 작성/수정 시 저장소로 넘기는 값 */
export interface PostInput {
  category: CategorySlug;
  title: string;
  shortDescription: string;
  description: string;
  primaryImageUrl: string | null;
  images: string[];
  externalUrl: string;
  platform: string | null;
  price: string | null;
  region: string | null;
  address: string | null;
  mapUrl: string | null;
  tags: string[];
  extra: PostExtra;
  contact: string | null;
}

export interface Profile {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  status: "active" | "blocked";
  createdAt: string;
  email?: string | null;
}

export interface Report {
  id: number;
  postId: number;
  reporterId: string | null;
  reason: string;
  detail: string | null;
  status: "open" | "resolved" | "rejected";
  createdAt: string;
  post?: Pick<Post, "id" | "title" | "status" | "category"> | null;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  targetUrl: string;
  /** side: 우측 사이드 / strip: 본문 중간 띠배너 */
  placement: "side" | "strip";
  theme: "coral" | "blue" | "mint" | "violet" | "amber";
  sortOrder: number;
  isActive: boolean;
}

export interface Notice {
  id: number;
  title: string;
  body: string;
  isPinned: boolean;
  publishedAt: string;
}

export type EventType =
  | "post_view"
  | "external_click"
  | "search"
  | "write_start"
  | "write_complete";

export interface SessionUser {
  id: string;
  email: string | null;
  nickname: string;
  isAdmin: boolean;
  status: "active" | "blocked";
}
