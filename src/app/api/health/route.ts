import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 배포 설정 점검용. 값은 절대 노출하지 않고 "설정되어 있는지(true/false)"만 알려줍니다.
 * 로그인이 "준비 중"으로 나오거나 샘플 글만 보일 때 어떤 설정이 빠졌는지 확인하세요.
 */
export async function GET() {
  const has = (v: string | undefined) => Boolean(v && v.trim());
  const checks = {
    NEXT_PUBLIC_SUPABASE_URL: has(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: has(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ADMIN_EMAILS: has(process.env.ADMIN_EMAILS),
  };
  const supabase = checks.NEXT_PUBLIC_SUPABASE_URL && checks.NEXT_PUBLIC_SUPABASE_ANON_KEY && checks.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json(
    { ok: supabase, mode: supabase ? "supabase" : "fallback(임시 샘플 모드)", checks },
    { status: supabase ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
