import "server-only";
import { applyPremiumCreative } from "./ad-creative";
import { AD_BANNER_SLOTS, AD_PREMIUM_SLOTS, HOUSE_AD_POST_ID, shuffle } from "./ads";
import { LIMITS } from "./constants";
import { store } from "./store";
import type { AdCreative, Post } from "./types";

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
    const seen = new Set<number>();
    const list: Post[] = [];
    const posts = await Promise.all(ads.map((a) => store.getPost(a.postId)));
    for (const [i, a] of ads.entries()) {
      const p = posts[i];
      if (!p || !isPostPublic(p) || seen.has(p.id)) continue;
      seen.add(p.id);
      // 프리미엄 카드는 직접 정한 이미지·문구가 있으면 덮어씌웁니다(링크는 원래 글 그대로).
      list.push(kind === "premium" ? applyPremiumCreative(p, a.creative) : p);
    }
    return kind === "premium" ? shuffle(list).slice(0, AD_PREMIUM_SLOTS) : shuffle(list);
  } catch {
    return [];
  }
}

/** 지금 노출 중인 배너 광고 — 글과 함께 제작 정보(직접 제작/업로드)를 돌려줍니다. */
export async function getLiveBannerAds(): Promise<Array<{ post: Post; creative: AdCreative | null }>> {
  try {
    const ads = await store.listAds({ kind: "banner", liveOnly: true });
    const out: Array<{ post: Post; creative: AdCreative | null }> = [];
    const seen = new Set<number>();
    const posts = await Promise.all(ads.map((a) => store.getPost(a.postId)));
    for (const [i, a] of ads.entries()) {
      const p = posts[i];
      if (!p || !isPostPublic(p) || seen.has(p.id)) continue;
      seen.add(p.id);
      out.push({ post: p, creative: a.creative });
    }
    return shuffle(out);
  } catch {
    return [];
  }
}

/** 홈 데이터는 모든 방문자에게 같으므로 서버 인스턴스 안에서 짧게(45초) 재사용해 DB 왕복을 줄입니다. 새 글은 최대 45초 늦게 보일 수 있어요. */
const HOME_TTL_MS = 45_000;
let homeCache: { at: number; data: ReturnType<typeof loadHomeData> } | null = null;

export function getHomeData() {
  const now = Date.now();
  if (homeCache && now - homeCache.at < HOME_TTL_MS) return homeCache.data;
  const data = loadHomeData();
  homeCache = { at: now, data };
  data.catch(() => {
    if (homeCache?.data === data) homeCache = null;
  });
  return data;
}

async function loadHomeData() {
  const [popular, latest, side, strip, notices, premium, adBanners, house] = await Promise.all([
    getPopularPosts(18),
    store.listPosts({ publicOnly: true, sort: "latest", pageSize: 20 }),
    store.listBanners({ activeOnly: true, placement: "side" }),
    store.listBanners({ activeOnly: true, placement: "strip" }),
    store.listNotices(5),
    getLiveAdPosts("premium"),
    getLiveBannerAds(),
    store.getPost(HOUSE_AD_POST_ID).catch(() => null),
  ]);
  // 운영자 고정 광고: 유료 광고가 자리를 다 채우지 않았을 때만 맨 앞에 넣습니다.
  const houseOk = house && isPostPublic(house) ? house : null;
  const premiumOut = houseOk && premium.length < AD_PREMIUM_SLOTS && !premium.some((p) => p.id === houseOk.id) ? [houseOk, ...premium] : premium;
  const bannersOut =
    houseOk && adBanners.length < AD_BANNER_SLOTS && !adBanners.some((b) => b.post.id === houseOk.id) ? [{ post: houseOk, creative: null }, ...adBanners] : adBanners;
  return { popular, latest: latest.items, sideBanners: side, stripBanners: strip, notices, premium: premiumOut, adBanners: bannersOut };
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
