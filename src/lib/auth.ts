import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminEmails, devLoginEnabled, supabaseConfigured } from "./env";
import { store } from "./store";
import { createSessionClient } from "./supabase/server";
import type { SessionUser } from "./types";

export const DEV_COOKIE = "hb_dev_uid";

export const DEV_USERS = {
  "dev-user": { nickname: "테스트회원", email: "tester@local.test", admin: false },
  "dev-admin": { nickname: "테스트관리자", email: "admin@local.test", admin: true },
} as const;

export type DevUserId = keyof typeof DEV_USERS;

export function isDevUserId(v: unknown): v is DevUserId {
  return typeof v === "string" && v in DEV_USERS;
}

function randomNickname(): string {
  return `홍보회원${Math.floor(1000 + Math.random() * 9000)}`;
}

/** 이동 경로(next)는 사이트 내부 경로만 허용 — open redirect 방지 */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\") || next.includes("\n")) return fallback;
  return next;
}

/** 현재 로그인한 사용자 (요청당 한 번만 조회). 로그인하지 않았으면 null */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (supabaseConfigured()) {
    const supabase = await createSessionClient();
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (error || !user) return null;
    let profile = await store.getProfile(user.id);
    if (!profile) {
      profile = await store.upsertProfile({
        id: user.id,
        nickname: randomNickname(),
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        email: user.email ?? null,
      });
    }
    const email = (user.email ?? "").toLowerCase();
    return {
      id: user.id,
      email: user.email ?? null,
      nickname: profile.nickname,
      isAdmin: !!email && adminEmails().includes(email),
      status: profile.status,
    };
  }

  if (devLoginEnabled()) {
    const jar = await cookies();
    const uid = jar.get(DEV_COOKIE)?.value;
    if (!isDevUserId(uid)) return null;
    const def = DEV_USERS[uid];
    let profile = await store.getProfile(uid);
    if (!profile) profile = await store.upsertProfile({ id: uid, nickname: def.nickname, email: def.email });
    return { id: uid, email: def.email, nickname: profile.nickname, isAdmin: def.admin, status: profile.status };
  }
  return null;
});

/** 로그인 필요 — 아니면 로그인 화면으로 보내고 로그인 후 원래 위치로 돌아오게 합니다. */
export async function requireUser(next = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(safeNext(next))}`);
  return user;
}

/** 관리자 전용 — 일반 사용자에게는 존재 자체를 노출하지 않도록 404 처리 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) notFound();
  return user;
}
