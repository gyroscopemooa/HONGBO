/** 사용자 광고·인플공구·기본 안내를 합친 전체 슬라이드 상한. */
export const HERO_TOTAL_SLOTS = 10;

export function heroCustomerCapacity(showInfl09: boolean): number {
  return HERO_TOTAL_SLOTS - (showInfl09 ? 1 : 0);
}

/** 기본 안내는 남은 자리만 사용하고, 광고가 줄면 자동 복원됩니다. */
export function selectHeroSlides<A, B>(ads: readonly A[], defaults: readonly B[], showInfl09: boolean) {
  const visibleAds = ads.slice(0, heroCustomerCapacity(showInfl09));
  const visibleDefaults = defaults.slice(0, HERO_TOTAL_SLOTS - visibleAds.length - (showInfl09 ? 1 : 0));
  return { ads: visibleAds, defaults: visibleDefaults, total: visibleAds.length + visibleDefaults.length + (showInfl09 ? 1 : 0) };
}
