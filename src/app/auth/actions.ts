"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEV_COOKIE, isDevUserId, safeNext } from "@/lib/auth";
import { devLoginEnabled, supabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export async function signOutAction() {
  if (supabaseConfigured()) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  const jar = await cookies();
  jar.delete(DEV_COOKIE);
  redirect("/");
}

/** 로컬 미리보기 전용 로그인 (Supabase 미설정 + 개발 환경에서만 동작) */
export async function devLoginAction(formData: FormData) {
  if (!devLoginEnabled()) redirect("/auth");
  const uid = formData.get("uid");
  if (!isDevUserId(uid)) redirect("/auth");
  const jar = await cookies();
  jar.set(DEV_COOKIE, uid, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  const next = safeNext(String(formData.get("next") ?? "/"));
  redirect(next);
}
