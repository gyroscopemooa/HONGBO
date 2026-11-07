"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { toggleLike } from "@/lib/likes-store";
import { isPostPublic } from "@/lib/queries";
import { rateLimit } from "@/lib/ratelimit";
import { store } from "@/lib/store";

export type LikeResult = { ok: true; on: boolean; count: number } | { ok: false; message: string };

export async function toggleLikeAction(postId: number): Promise<LikeResult> {
  if (!Number.isSafeInteger(postId) || postId <= 0) return { ok: false, message: "올바르지 않은 게시글이에요." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "로그인하면 좋아요를 누를 수 있어요." };
  if (user.status !== "active") return { ok: false, message: "이 계정으로는 좋아요를 누를 수 없어요." };
  if (!rateLimit(`like:${user.id}`, 60, 600_000)) return { ok: false, message: "잠시 후 다시 시도해주세요." };

  const post = await store.getPost(postId);
  if (!post || !isPostPublic(post)) return { ok: false, message: "현재 공개된 글이 아니에요." };

  try {
    const result = await toggleLike(user.id, postId);
    revalidatePath(`/post/${postId}`);
    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath(`/category/${post.category}`);
    return { ok: true, ...result };
  } catch (error) {
    console.error("like toggle failed", error);
    return { ok: false, message: "좋아요를 저장하지 못했어요. 잠시 후 다시 시도해주세요." };
  }
}
