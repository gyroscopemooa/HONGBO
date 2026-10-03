import "server-only";
import { LIMITS } from "./constants";
import { store } from "./store";
import type { Post } from "./types";

/**
 * 인기 정렬 방식을 결정합니다.
 * - 최근 72시간의 "유효 이벤트(조회+외부 클릭)"가 충분히 쌓이기 전: 운영자 큐레이션(고정/순위) 우선
 * - 충분히 쌓인 뒤: 실제 조회/클릭 기반 자동 인기순
 */
export async function getPopularMode(): Promise<"curated" | "score"> {
  const n = await store.countRecentEvents(LIMITS.popularWindowHours);
  return n >= LIMITS.autoPopularMinEvents ? "score" : "curated";
}

/** 메인 "오늘의 인기 홍보" / 랭킹용 목록 */
export async function getPopularPosts(limit: number): Promise<Post[]> {
  const mode = await getPopularMode();
  const base = await store.listPosts({
    publicOnly: true,
    sort: "popular",
    popularMode: mode,
    pageSize: Math.max(limit, 1),
  });
  if (mode === "curated") return base.items;

  // 자동 모드: 최근 72시간의 실제 점수가 있는 글을 먼저, 부족하면 위 정렬로 채움
  const scores = await store.popularScores(LIMITS.popularWindowHours, limit * 2);
  const scored = (await Promise.all(scores.map((s) => store.getPost(s.postId))))
    .filter((p): p is Post => !!p && p.status === "active" && (!p.expiresAt || new Date(p.expiresAt).getTime() > Date.now()))
    .slice(0, limit);
  const seen = new Set(scored.map((p) => p.id));
  return [...scored, ...base.items.filter((p) => !seen.has(p.id))].slice(0, limit);
}

export async function getHomeData() {
  const [popular, latest, side, strip, notices] = await Promise.all([
    getPopularPosts(12),
    store.listPosts({ publicOnly: true, sort: "latest", pageSize: 10 }),
    store.listBanners({ activeOnly: true, placement: "side" }),
    store.listBanners({ activeOnly: true, placement: "strip" }),
    store.listNotices(5),
  ]);
  return { popular, latest: latest.items, sideBanners: side, stripBanners: strip, notices };
}

export function isPostPublic(p: Pick<Post, "status" | "expiresAt">): boolean {
  return p.status === "active" && (!p.expiresAt || new Date(p.expiresAt).getTime() > Date.now());
}

export function postExpiryFromNow(): string {
  return new Date(Date.now() + LIMITS.postLifetimeDays * 86_400_000).toISOString();
}

/** 표시용 상태 (active 이지만 기간이 지난 글은 expired) */
export function effectiveStatus(p: Pick<Post, "status" | "expiresAt">): Post["status"] {
  if (p.status === "active" && p.expiresAt && new Date(p.expiresAt).getTime() <= Date.now()) return "expired";
  return p.status;
}
