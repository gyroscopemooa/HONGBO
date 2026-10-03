import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase 로그인 세션 쿠키를 갱신합니다.
 * (Cloudflare 배포를 위해 Node 런타임 proxy.ts 대신 엣지 방식 middleware.ts 를 사용합니다.)
 * Supabase 환경변수가 없으면(로컬 미리보기) 아무 것도 하지 않습니다.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // 세션 토큰을 필요하면 갱신합니다. (이 호출을 지우면 로그인이 풀릴 수 있습니다.)
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // 정적 파일·이미지·seed 이미지·검색엔진용 파일은 제외
    "/((?!_next/static|_next/image|seed/|defaults/|uploads/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
