"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { toggleFavorite } from "@/lib/favorites-store";
import { rateLimit } from "@/lib/ratelimit";
import { store } from "@/lib/store";

export type FavoriteResult = { ok: true; on: boolean } | { ok: false; message: string; login?: boolean };

export async function toggleFavoriteAction(postId: number): Promise<FavoriteResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "로그인이 필요해요.", login: true };
  if (!rateLimit(`favorite:${user.id}`, 60, 600_000)) return { ok: false, message: "잠시 후 다시 시도해주세요." };
  const post = await store.getPost(postId);
  if (!post || post.status === "deleted") return { ok: false, message: "글을 찾을 수 없어요." };
  try {
    const on = await toggleFavorite(user.id, postId);
    revalidatePath("/mypage/favorites");
    return { ok: true, on };
  } catch (error) {
    console.error("favorite toggle failed", error);
    return { ok: false, message: "지금은 찜할 수 없어요. 잠시 후 다시 시도해주세요." };
  }
}
