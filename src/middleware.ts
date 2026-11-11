import { unknownPlayEditorialPath, PLAY_NOT_FOUND_HTML } from "@/lib/play-routing";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase 로그인 세션 쿠키를 갱신합니다.
 * (Cloudflare 배포를 위해 Node 런타임 proxy.ts 대신 엣지 방식 middleware.ts 를 사용합니다.)
 * Supabase 환경변수가 없으면(로컬 미리보기) 아무 것도 하지 않습니다.
 */
const AB_COOKIE = "hb_ab";
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|lighthouse|headless|monitor|curl|wget/i;

/**
 * 랜딩 A/B 테스트: "/" 로 들어온 방문자를 절반씩 A(기존 홈) / B(전체 홍보글 화면)로 나눕니다.
 * - 방문자별로 한 번 정해지면 쿠키로 계속 같은 화면을 봅니다. (새로고침해도 바뀌지 않음)
 * - 검색엔진·봇은 항상 A. 주소는 그대로 "/" 이고 내용만 바뀝니다.
 * - ?ab=a / ?ab=b 로 직접 골라 볼 수 있습니다. 끄려면 환경변수 LANDING_AB=off.
 */
function landingVariant(request: NextRequest): { variant: "a" | "b"; set: boolean } {
  if (process.env.LANDING_AB === "off") return { variant: "a", set: false };
  if (BOT_RE.test(request.headers.get("user-agent") ?? "")) return { variant: "a", set: false };
  const forced = request.nextUrl.searchParams.get("ab");
  if (forced === "a" || forced === "b") return { variant: forced, set: true };
  // 사이트 안에서 로고/홈을 눌러 온 경우는 항상 기존 홈. 테스트는 밖에서 처음 들어오는 방문에만 적용합니다.
  try {
    const ref = request.headers.get("referer");
    if (ref && new URL(ref).host === request.nextUrl.host) return { variant: "a", set: false };
  } catch {
    /* referer 가 이상하면 무시 */
  }
  const cur = request.cookies.get(AB_COOKIE)?.value;
  if (cur === "a" || cur === "b") return { variant: cur, set: false };
  return { variant: Math.random() < 0.5 ? "a" : "b", set: true };
}

export async function middleware(request: NextRequest) {
  if (unknownPlayEditorialPath(request.nextUrl.pathname)) return new NextResponse(PLAY_NOT_FOUND_HTML, {status:404,headers:{"Content-Type":"text/html; charset=utf-8","X-Robots-Tag":"noindex, follow"}});
  const isLanding = request.nextUrl.pathname === "/" && request.method === "GET";
  const ab = isLanding ? landingVariant(request) : null;
  const finish = (res: NextResponse): NextResponse => {
    if (!ab) return res;
    let out = res;
    if (ab.variant === "b") {
      out = NextResponse.rewrite(new URL("/posts", request.url), { request });
      for (const c of res.cookies.getAll()) out.cookies.set(c);
    }
    if (ab.set) out.cookies.set(AB_COOKIE, ab.variant, { maxAge: 60 * 60 * 24 * 90, path: "/", sameSite: "lax" });
    return out;
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return finish(NextResponse.next());

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
  return finish(response);
}

export const config = {
  matcher: [
    // 정적 파일·이미지·seed 이미지·검색엔진용 파일은 제외
    "/((?!_next/static|_next/image|seed/|defaults/|uploads/|favicon.ico|robots.txt|sitemap.xml|rss.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
