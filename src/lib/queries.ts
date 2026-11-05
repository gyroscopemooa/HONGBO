import "server-only";
import { AD_PREMIUM_SLOTS, shuffle } from "./ads";
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

/** 지금 노출 중인 광고 글. 광고 테이블이 아직 없어도 홈이 깨지지 않도록 실패하면 빈 목록을 돌려줍니다. */
export async function getLiveAdPosts(kind: "premium" | "banner"): Promise<Post[]> {
  try {
    const ads = await store.listAds({ kind, liveOnly: true });
    const posts = await Promise.all(ads.map((a) => store.getPost(a.postId)));
    const seen = new Set<number>();
    const list = posts.filter((p): p is Post => {
      if (!p || !isPostPublic(p) || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    return kind === "premium" ? shuffle(list).slice(0, AD_PREMIUM_SLOTS) : shuffle(list);
  } catch {
    return [];
  }
}

export async function getHomeData() {
  const [popular, latest, side, strip, notices, premium, adBanners] = await Promise.all([
    getPopularPosts(18),
    store.listPosts({ publicOnly: true, sort: "latest", pageSize: 20 }),
    store.listBanners({ activeOnly: true, placement: "side" }),
    store.listBanners({ activeOnly: true, placement: "strip" }),
    store.listNotices(5),
    getLiveAdPosts("premium"),
    getLiveAdPosts("banner"),
  ]);
  return { popular, latest: latest.items, sideBanners: side, stripBanners: strip, notices, premium, adBanners };
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
