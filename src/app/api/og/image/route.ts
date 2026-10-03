import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sniffImage } from "@/lib/og";
import { rateLimit } from "@/lib/ratelimit";
import { safeFetch } from "@/lib/safe-fetch";

export const dynamic = "force-dynamic";

/** 링크의 대표 이미지를 서버가 대신 받아 같은 출처로 전달합니다. (브라우저에서 자르기/업로드하기 위함) */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("login required", { status: 401 });
  if (!rateLimit(`ogimg:${user.id}`, 30, 3_600_000)) return new NextResponse("too many requests", { status: 429 });

  try {
    const res = await safeFetch(req.nextUrl.searchParams.get("src") ?? "", {
      accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.5",
      maxBytes: 5 * 1024 * 1024,
      timeoutMs: 8000,
    });
    const kind = res.status < 400 ? sniffImage(res.body) : null;
    if (!kind) return new NextResponse("not an image", { status: 415 });
    return new NextResponse(res.body as BodyInit, {
      headers: {
        "content-type": kind.mime,
        "x-content-type-options": "nosniff",
        "cache-control": "private, max-age=300",
        "content-security-policy": "default-src 'none'",
      },
    });
  } catch {
    return new NextResponse("fetch failed", { status: 502 });
  }
}
