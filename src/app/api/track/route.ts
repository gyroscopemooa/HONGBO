import { NextResponse, type NextRequest } from "next/server";
import { ensureAnonId, looksLikeBot } from "@/lib/anon";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { isPostPublic } from "@/lib/queries";
import { store } from "@/lib/store";
import type { EventType } from "@/lib/types";

const ALLOWED: EventType[] = ["post_view", "external_click", "search", "write_start"];

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

/** 조회/외부 클릭 등 가벼운 이벤트 수집. 봇·새로고침 도배는 최대한 제외하고 실제 값만 기록합니다. */
export async function POST(req: NextRequest) {
  const noContent = () => new NextResponse(null, { status: 204 });
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });
  if (looksLikeBot(req.headers.get("user-agent"))) return noContent();

  let body: { type?: string; postId?: number | string };
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const type = body.type as EventType;
  if (!ALLOWED.includes(type)) return new NextResponse(null, { status: 400 });

  const anonId = await ensureAnonId();
  if (!rateLimit(`track:${anonId}`, 90, 60_000)) return noContent();

  const user = await getCurrentUser();

  if (type === "post_view" || type === "external_click") {
    const postId = Number(body.postId);
    if (!Number.isInteger(postId) || postId <= 0) return new NextResponse(null, { status: 400 });
    const post = await store.getPost(postId);
    if (!post || !isPostPublic(post)) return noContent();
    // 작성자 본인의 조회/클릭은 집계에서 제외
    if (user && post.authorId === user.id) return noContent();
    const dedupeMin = type === "post_view" ? 30 : 10;
    if (await store.hasRecentEvent(type, postId, anonId, dedupeMin)) return noContent();
    await store.recordEvent({ type, postId, anonId, userId: user?.id ?? null });
    await store.incrementCounter(postId, type === "post_view" ? "view" : "click");
    return noContent();
  }

  await store.recordEvent({ type, anonId, userId: user?.id ?? null });
  return noContent();
}
