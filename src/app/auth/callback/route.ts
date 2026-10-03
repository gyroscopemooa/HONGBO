import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Google 로그인 후 돌아오는 주소 — 인증 코드를 세션으로 교환하고 원래 가려던 페이지로 보냅니다. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");

  if (supabaseConfigured() && code) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL(`/auth?error=1&next=${encodeURIComponent(next)}`, origin));
}
