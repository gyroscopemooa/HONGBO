"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { findBannedKeyword } from "@/lib/policy";
import * as comments from "@/lib/private-post-comments";
import { rateLimit } from "@/lib/ratelimit";
import { store } from "@/lib/store";

type Result = { ok: true } | { ok: false; message: string };

async function access(postId: number): Promise<{ userId: string; nickname: string; isAdmin: boolean } | Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "로그인이 필요해요." };
  if (user.status === "blocked") return { ok: false, message: "이용이 제한된 계정이에요." };
  const post = await store.getPost(postId);
  if (!post || post.status === "deleted") return { ok: false, message: "글을 찾을 수 없어요." };
  if (post.authorId !== user.id && !user.isAdmin) return { ok: false, message: "댓글은 글 작성자와 관리자만 사용할 수 있어요." };
  return { userId: user.id, nickname: user.nickname, isAdmin: user.isAdmin };
}

const refresh = (postId: number) => revalidatePath(`/post/${postId}`);

export async function addPrivatePostCommentAction(postId: number, body: string): Promise<Result> {
  if (!Number.isSafeInteger(postId) || postId < 1 || typeof body !== "string" || body.trim().length < 1 || body.trim().length > 3000)
    return { ok: false, message: "댓글은 1~3,000자로 입력해주세요." };
  const actor = await access(postId);
  if ("ok" in actor) return actor;
  if (findBannedKeyword(body)) return { ok: false, message: "댓글에 등록할 수 없는 내용이 포함되어 있어요." };
  if (!rateLimit(`private-post-comment:${actor.userId}`, 15, 60_000)) return { ok: false, message: "댓글 작성 간격을 두고 다시 시도해주세요." };
  try {
    if ((await comments.listPrivatePostComments(postId)).length >= 1000) return { ok: false, message: "이 글은 댓글 한도에 도달했어요." };
    await comments.addPrivatePostComment(postId, actor.userId, actor.nickname, body.trim());
    refresh(postId);
    return { ok: true };
  } catch {
    return { ok: false, message: "댓글을 등록하지 못했어요. 잠시 뒤 다시 시도해주세요." };
  }
}

export async function deletePrivatePostCommentAction(id: number): Promise<Result> {
  if (!Number.isSafeInteger(id) || id < 1) return { ok: false, message: "댓글을 찾을 수 없어요." };
  try {
    const comment = await comments.getPrivatePostComment(id);
    if (!comment) return { ok: false, message: "댓글을 찾을 수 없어요." };
    const actor = await access(comment.postId);
    if ("ok" in actor) return actor;
    if (comment.authorId !== actor.userId && !actor.isAdmin) return { ok: false, message: "삭제 권한이 없어요." };
    await comments.deletePrivatePostComment(id);
    refresh(comment.postId);
    return { ok: true };
  } catch {
    return { ok: false, message: "댓글을 삭제하지 못했어요. 잠시 뒤 다시 시도해주세요." };
  }
}

export async function updatePrivatePostCommentAction(id: number, body: string): Promise<Result> {
  if (!Number.isSafeInteger(id) || id < 1 || typeof body !== "string" || body.trim().length < 1 || body.trim().length > 3000)
    return { ok: false, message: "댓글은 1~3,000자로 입력해주세요." };
  if (findBannedKeyword(body)) return { ok: false, message: "댓글에 등록할 수 없는 내용이 포함되어 있어요." };
  try {
    const comment = await comments.getPrivatePostComment(id);
    if (!comment || comment.status !== "active") return { ok: false, message: "댓글을 찾을 수 없어요." };
    const actor = await access(comment.postId);
    if ("ok" in actor) return actor;
    if (comment.authorId !== actor.userId) return { ok: false, message: "내가 작성한 댓글만 수정할 수 있어요." };
    await comments.updatePrivatePostComment(id, body.trim());
    refresh(comment.postId);
    return { ok: true };
  } catch {
    return { ok: false, message: "댓글을 수정하지 못했어요. 잠시 뒤 다시 시도해주세요." };
  }
}
