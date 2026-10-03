/** 환경변수 헬퍼 — 서버 전용(클라이언트에서는 NEXT_PUBLIC_* 만 사용 가능) */

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** 관리자 이메일 목록 (쉼표 구분). 이 이메일로 Google 로그인한 계정이 관리자입니다. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Supabase 가 설정되지 않은 환경(로컬 개발/미리보기)에서만 쓰는 "개발용 로그인".
 * 운영(production)에서는 HONGBO_DEV_LOGIN=1 로 명시하지 않는 한 켜지지 않습니다.
 */
export function devLoginEnabled(): boolean {
  if (supabaseConfigured()) return false;
  return process.env.NODE_ENV !== "production" || process.env.HONGBO_DEV_LOGIN === "1";
}

export function contactEmail(): string | null {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;
}
