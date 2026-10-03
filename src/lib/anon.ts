import "server-only";
import { cookies } from "next/headers";

export const ANON_COOKIE = "hb_aid";

/** 익명 방문자 식별자(조회수 중복 제한·신고 제한용). 개인정보가 아닌 무작위 값입니다. */
export async function readAnonId(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(ANON_COOKIE)?.value;
  return v && /^[0-9a-f-]{20,40}$/.test(v) ? v : null;
}

/** 서버 액션/라우트 핸들러에서만 호출 (쿠키 쓰기 가능). 없으면 새로 발급합니다. */
export async function ensureAnonId(): Promise<string> {
  const jar = await cookies();
  const existing = await readAnonId();
  if (existing) return existing;
  const id = crypto.randomUUID();
  jar.set(ANON_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

const BOT_UA = /bot|crawl|spider|slurp|headless|preview|facebookexternalhit|embedly|lighthouse|python-requests|curl|wget|httpclient/i;
export function looksLikeBot(userAgent: string | null): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}
