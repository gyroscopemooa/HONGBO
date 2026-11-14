import "server-only";
import { store } from "./store";
import { listHeroAds } from "./hero-ad-store";

export function freeAdTrialEnabled() { return process.env.AD_FREE_TRIAL_ENABLED !== "false"; }
export const TRIAL_PREFIX = "[FREE7:";
export function trialMemo(postId: number, memo: string | null) { return `${TRIAL_PREFIX}${postId}] ${memo ?? ""}`.slice(0,500); }
export function parseTrialMemo(memo: string | null) {
  const match = memo?.match(/^\[FREE7:(\d+)\] /);
  return { freeTrial: !!match, postId: match ? Number(match[1]) : null, memo: match ? memo!.slice(match[0].length) : memo };
}

/** Existing-record check. Manual review remains mandatory; not a DB uniqueness guarantee. */
export async function hasFreeAdTrial(userId: string, postId: number, exclude?: { kind: "ad" | "hero"; id: number }) {
  const [ads, hero] = await Promise.all([store.listAds(), listHeroAds()]);
  const records = [
    ...ads.filter(a => a.freeTrial).map(a => ({ kind: "ad" as const, id:a.id, userId:a.requestedBy, postId:a.postId, createdAt:a.createdAt })),
    ...hero.filter(a => a.freeTrial).map(a => ({ kind: "hero" as const, id:a.id, userId:a.requestedBy, postId:a.postId, createdAt:a.createdAt })),
  ].filter(a => a.userId === userId || a.postId === postId)
    .sort((a,b) => a.createdAt.localeCompare(b.createdAt) || a.kind.localeCompare(b.kind) || a.id-b.id);
  if (!exclude) return records.length > 0;
  // If simultaneous submissions slipped through, only the first may be approved.
  const first = records[0];
  return !!first && !(first.kind === exclude.kind && first.id === exclude.id);
}
