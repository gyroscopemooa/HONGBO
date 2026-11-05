import "server-only";

/**
 * 인플09 단건 콘텐츠 홍보 전용 신청 페이지 주소.
 * 인플09에서 확정한 전용 URL 을 환경변수 INFL09_CONTENT_APPLY_URL 에 넣으세요. (https 주소만 허용)
 * 값이 없거나 올바르지 않으면 null — 임의의 기존 신청 주소로 대신 연결하지 않습니다.
 */
export function infl09ApplyUrl(): string | null {
  const raw = process.env.INFL09_CONTENT_APPLY_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    u.searchParams.set("utm_source", "thehongbo");
    u.searchParams.set("utm_medium", "service_banner");
    u.searchParams.set("utm_campaign", "content_collaboration");
    return u.toString();
  } catch {
    return null;
  }
}
