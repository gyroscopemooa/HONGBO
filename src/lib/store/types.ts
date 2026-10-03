import type { CategorySlug } from "../constants";
import type { Banner, EventType, Notice, Post, PostInput, PostStatus, Profile, Report } from "../types";

export type ListSort = "latest" | "popular";

export interface ListQuery {
  category?: CategorySlug;
  /** 제목/한 줄 소개/상세 설명/태그 검색 */
  q?: string;
  region?: string;
  sort?: ListSort;
  page?: number;
  pageSize?: number;
  /** true 면 공개 조건(상태 active + 만료 전)인 글만 */
  publicOnly?: boolean;
  /** 관리자 필터: 상태 (expired 는 "active 이지만 기간이 지난 글") */
  status?: PostStatus | "expired";
  isSeed?: boolean;
  authorId?: string;
  pinnedOnly?: boolean;
  /** 지역 정보가 있는 글만 */
  hasRegion?: boolean;
  excludeIds?: number[];
  /** 인기순 정렬 방식: curated=운영자 큐레이션 우선, score=실제 조회/클릭 우선 */
  popularMode?: "curated" | "score";
}

export interface ListResult {
  items: Post[];
  total: number;
}

export interface NewReport {
  postId: number;
  reporterId: string | null;
  reporterAnon: string | null;
  reason: string;
  detail: string | null;
}

export interface EventInput {
  type: EventType;
  postId?: number | null;
  anonId?: string | null;
  userId?: string | null;
}

export interface Stats {
  posts: number;
  active: number;
  hidden: number;
  seed: number;
  openReports: number;
  users: number;
}

export interface Store {
  // ── posts ──
  listPosts(q: ListQuery): Promise<ListResult>;
  getPost(id: number): Promise<Post | null>;
  createPost(authorId: string, input: PostInput, expiresAt: string | null): Promise<Post>;
  updatePost(id: number, input: PostInput): Promise<Post | null>;
  setPostStatus(id: number, status: PostStatus): Promise<void>;
  deletePost(id: number): Promise<void>;
  setPinned(id: number, pinned: boolean, curatedRank: number | null): Promise<void>;
  renewPost(id: number, expiresAt: string | null): Promise<void>;
  /** 시드 글 일괄 처리. 변경된 개수 반환 */
  bulkSeed(action: "hide" | "show" | "delete"): Promise<number>;
  countAuthorPostsSince(authorId: string, sinceIso: string): Promise<number>;
  findActiveByUrl(authorId: string, url: string, excludeId?: number): Promise<Post | null>;

  // ── analytics ──
  incrementCounter(postId: number, kind: "view" | "click"): Promise<void>;
  recordEvent(e: EventInput): Promise<void>;
  hasRecentEvent(type: EventType, postId: number, anonId: string, withinMinutes: number): Promise<boolean>;
  countRecentEvents(hours: number): Promise<number>;
  popularScores(hours: number, limit: number): Promise<Array<{ postId: number; score: number }>>;

  // ── profiles ──
  getProfile(id: string): Promise<Profile | null>;
  upsertProfile(p: { id: string; nickname: string; avatarUrl?: string | null; email?: string | null }): Promise<Profile>;
  updateNickname(id: string, nickname: string): Promise<void>;
  setProfileStatus(id: string, status: "active" | "blocked"): Promise<void>;
  listProfiles(opts: { q?: string; page?: number; pageSize?: number }): Promise<{ items: Profile[]; total: number }>;

  // ── reports ──
  createReport(r: NewReport): Promise<void>;
  listReports(status?: Report["status"]): Promise<Report[]>;
  setReportStatus(id: number, status: Report["status"]): Promise<void>;
  countRecentReports(opts: { userId?: string | null; anonId?: string | null }, sinceIso: string): Promise<number>;
  hasOpenReport(postId: number, opts: { userId?: string | null; anonId?: string | null }): Promise<boolean>;

  // ── banners / notices ──
  listBanners(opts?: { activeOnly?: boolean; placement?: Banner["placement"] }): Promise<Banner[]>;
  saveBanner(b: Omit<Banner, "id"> & { id?: number }): Promise<void>;
  deleteBanner(id: number): Promise<void>;
  listNotices(limit?: number): Promise<Notice[]>;
  saveNotice(n: { id?: number; title: string; body: string; isPinned: boolean }): Promise<void>;
  deleteNotice(id: number): Promise<void>;

  stats(): Promise<Stats>;
}
