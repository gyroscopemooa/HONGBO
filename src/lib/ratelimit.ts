/**
 * 아주 가벼운 메모리 기반 요청 제한.
 * 서버리스 인스턴스마다 따로 카운트되므로 "완벽한 차단"이 아니라 남용 방지용 1차 장치입니다.
 */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    }
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}
