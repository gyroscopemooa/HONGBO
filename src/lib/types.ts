import type { CategorySlug } from "./constants";

export type PostStatus = "active" | "hidden" | "blocked" | "expired" | "deleted";

/** 카테고리별로 필요한 추가 입력값. 카드에는 쓰이지 않고 상세 페이지에서만 사용합니다. */
export interface ExtraLink {
  label: string;
  url: string;
}

/** 설문 완료 후 혜택 지급 방식: instant=완료 화면에 안내 문구·링크 표시, draw=추첨(연락처 수집) */
export type SurveyPayout = "instant" | "draw";

/** 게시글에 포함되는 간단한 자체 설문 양식. 응답은 별도 비공개 테이블에 보관합니다. */
export interface SurveyQuestion {
  id: string;
  title: string;
  type: "choice" | "text";
  required: boolean;
  options?: string[];
  /** 객관식 마지막에 "기타(직접 입력)" 선택지를 붙이고, 고르면 입력창을 보여줍니다. */
  allowOther?: boolean;
}

export interface PostExtra {
  /** 추가 링크(이벤트 참여, 쿠폰 받기 등). 상세 페이지에서 버튼으로 보여줍니다. */
  links?: ExtraLink[];
  playUrl?: string;
  appStoreUrl?: string;
  siteUrl?: string;
  /** 서비스: online | offline | mixed */
  usageType?: string;
  /** 모집 기간 (자유 텍스트) */
  period?: string;
  /** 오프라인 가게: 영업/문의 링크 */
  businessUrl?: string;
  /** 유튜브 영상 ID (상세 페이지에서 재생) */
  youtubeId?: string;
  /** 혜택 배지 값 (BENEFITS의 value) */
  benefits?: string[];
  /** 더홍보 전용 이벤트. reward=혜택 내용, how=받는 방법 */
  exclusive?: { reward: string; how: string; method?: "say" | "code" | "link" | "survey"; code?: string; url?: string; survey?: SurveyQuestion[]; payout?: SurveyPayout; rewardText?: string };
  /** 운영자만 지정: official(더홍보 공식) | verified(더홍보 인증). 작성자 입력으로는 바뀌지 않음 */
  official?: "official" | "verified";
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
  /** 한줄홍보는 링크 없이도 등록할 수 있어 null 일 수 있습니다 */
  externalUrl: string | null;
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
  /** 공개 좋아요 수. 기존/로컬 게시글은 0으로 처리합니다. */
  likeCount?: number;
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
  externalUrl: string | null;
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

/**
 * 배너 광고의 제작 방식. 없으면(null) 등록한 글의 이미지·제목·소개로 자동 제작합니다.
 * - upload: 고객이 만든 완성 배너 이미지(4:1)를 그대로 보여줌
 * - custom: 고객이 고른 배경 사진 + 직접 쓴 문구로 서비스가 배너를 구성
 */
export interface AdCreative {
  mode: "upload" | "custom";
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  /** dark: 어두운 배경 + 흰 글씨 / light: 밝은 배경 + 어두운 글씨 */
  tone?: "dark" | "light";
}

/** 유료 광고(상단 프리미엄 3칸 / 와이드 배너). 신청 → 운영자 승인(입금 확인) → 기간 동안 노출. */
export interface Ad {
  id: number;
  postId: number;
  kind: "premium" | "banner";
  plan: "week" | "month";
  /** requested: 신청됨(승인 대기) / active: 승인됨(기간 내에만 노출) */
  status: "requested" | "active";
  /** 프리미엄 칸 번호(1~10). 배너는 null */
  slotNo: number | null;
  startsAt: string | null;
  endsAt: string | null;
  requestedBy: string | null;
  /** 배너 직접 제작/업로드 정보 (배너 상품만, 자동 제작이면 null) */
  creative: AdCreative | null;
  createdAt: string;
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
  | "write_complete"
  | "landing_a"
  | "landing_b";

export interface SessionUser {
  id: string;
  email: string | null;
  nickname: string;
  isAdmin: boolean;
  status: "active" | "blocked";
}
