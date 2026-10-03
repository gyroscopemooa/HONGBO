import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseOg } from "@/lib/og";
import { rateLimit } from "@/lib/ratelimit";
import { safeFetch } from "@/lib/safe-fetch";

export const dynamic = "force-dynamic";

/** 링크를 붙였을 때 제목/설명/이미지를 불러오는 작성 보조 API. 실패해도 글쓰기는 막히지 않습니다. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (!rateLimit(`og:${user.id}`, 40, 3_600_000)) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const url = req.nextUrl.searchParams.get("url") ?? "";
  try {
    const res = await safeFetch(url, {
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
      maxBytes: 400_000,
      allowTruncate: true,
      timeoutMs: 7000,
    });
    if (res.status >= 400) return NextResponse.json({ error: "페이지 정보를 불러오지 못했어요." }, { status: 200 });
    if (!/text\/html|application\/xhtml/i.test(res.contentType)) {
      return NextResponse.json({ error: "웹페이지 링크가 아니에요." }, { status: 200 });
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(res.body);
    return NextResponse.json({ ok: true, ...parseOg(html, res.finalUrl) });
  } catch {
    return NextResponse.json({ error: "페이지 정보를 불러오지 못했어요. 직접 입력해도 괜찮아요." }, { status: 200 });
  }
}
