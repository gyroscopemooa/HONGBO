"use server";

import { revalidatePath } from "next/cache";
import { ensureAnonId } from "@/lib/anon";
import { getCurrentUser } from "@/lib/auth";
import { REPORT_REASON_LABELS, LIMITS } from "@/lib/constants";
import { postExpiryFromNow } from "@/lib/queries";
import { rateLimit } from "@/lib/ratelimit";
import { store } from "@/lib/store";
import { parsePostInput, type FieldErrors } from "@/lib/validation";

export type ActionResult =
  | { ok: true; id?: number; message?: string }
  | { ok: false; message: string; errors?: FieldErrors; code?: "auth" };

const NEED_LOGIN: ActionResult = { ok: false, message: "로그인이 필요해요.", code: "auth" };

/** 홍보글 등록 */
export async function createPostAction(raw: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  if (user.status === "blocked") return { ok: false, message: "작성이 제한된 계정이에요. 문의하기로 연락해주세요." };

  const parsed = parsePostInput(raw);
  if (!parsed.ok) return { ok: false, message: parsed.message, errors: parsed.errors };

  // 도배 방지: 짧은 시간 연속 등록 제한
  const tenMin = new Date(Date.now() - 10 * 60_000).toISOString();
  const oneDay = new Date(Date.now() - 24 * 3_600_000).toISOString();
  if ((await store.countAuthorPostsSince(user.id, tenMin)) >= LIMITS.postsPer10Min) {
    return { ok: false, message: "짧은 시간에 너무 많이 등록했어요. 10분 뒤에 다시 시도해주세요." };
  }
  if ((await store.countAuthorPostsSince(user.id, oneDay)) >= LIMITS.postsPerDay) {
    return { ok: false, message: `하루에 등록할 수 있는 홍보글(${LIMITS.postsPerDay}개)을 모두 사용했어요.` };
  }
  // 같은 링크 반복 등록 제한
  if (await store.findActiveByUrl(user.id, parsed.data.externalUrl)) {
    return {
      ok: false,
      message: "같은 링크로 등록한 홍보글이 이미 있어요. 기존 글을 수정하거나 '다시 홍보하기'를 이용해주세요.",
      errors: { externalUrl: "이미 같은 링크로 등록한 홍보글이 있어요." },
    };
  }

  const post = await store.createPost(user.id, parsed.data, postExpiryFromNow());
  await store.recordEvent({ type: "write_complete", postId: post.id, userId: user.id });
  revalidatePath("/", "layout");
  return { ok: true, id: post.id };
}

/** 홍보글 수정 (작성자 본인 또는 관리자) */
export async function updatePostAction(id: number, raw: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  const post = await store.getPost(id);
  if (!post || post.status === "deleted") return { ok: false, message: "글을 찾을 수 없어요." };
  if (post.authorId !== user.id && !user.isAdmin) return { ok: false, message: "수정 권한이 없어요." };
  if (user.status === "blocked" && !user.isAdmin) return { ok: false, message: "작성이 제한된 계정이에요." };

  const parsed = parsePostInput(raw);
  if (!parsed.ok) return { ok: false, message: parsed.message, errors: parsed.errors };

  if (post.authorId && (await store.findActiveByUrl(post.authorId, parsed.data.externalUrl, post.id))) {
    return {
      ok: false,
      message: "같은 링크로 등록한 다른 홍보글이 있어요.",
      errors: { externalUrl: "이미 같은 링크로 등록한 홍보글이 있어요." },
    };
  }

  await store.updatePost(id, parsed.data);
  revalidatePath("/", "layout");
  return { ok: true, id };
}

/** 홍보글 삭제 (작성자 본인) — 화면에서 숨기는 소프트 삭제 */
export async function deletePostAction(id: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  const post = await store.getPost(id);
  if (!post) return { ok: false, message: "글을 찾을 수 없어요." };
  if (post.authorId !== user.id && !user.isAdmin) return { ok: false, message: "삭제 권한이 없어요." };
  await store.setPostStatus(id, "deleted");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** 다시 홍보하기 — 최신글 노출 기준과 노출 기간만 갱신 (인기 순위는 올라가지 않음) */
export async function renewPostAction(id: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  const post = await store.getPost(id);
  if (!post || post.status === "deleted") return { ok: false, message: "글을 찾을 수 없어요." };
  if (post.authorId !== user.id) return { ok: false, message: "권한이 없어요." };
  if (post.status === "hidden" || post.status === "blocked") {
    return { ok: false, message: "숨김 처리된 글은 다시 홍보할 수 없어요." };
  }
  if (Date.now() - new Date(post.bumpedAt).getTime() < 24 * 3_600_000 && post.status === "active") {
    return { ok: false, message: "다시 홍보하기는 하루에 한 번만 할 수 있어요." };
  }
  await store.renewPost(id, postExpiryFromNow());
  revalidatePath("/", "layout");
  return { ok: true, message: "다시 홍보하기가 완료됐어요!" };
}

/** 신고 — 로그인하지 않아도 가능 (익명 식별자로 남용 제한) */
export async function reportPostAction(postId: number, reason: string, detail: string): Promise<ActionResult> {
  if (!(reason in REPORT_REASON_LABELS)) return { ok: false, message: "신고 사유를 선택해주세요." };
  const post = await store.getPost(postId);
  if (!post) return { ok: false, message: "글을 찾을 수 없어요." };

  const user = await getCurrentUser();
  const anonId = await ensureAnonId();
  const who = { userId: user?.id ?? null, anonId };
  if (!rateLimit(`report:${anonId}`, 8, 3_600_000)) return { ok: false, message: "신고가 너무 많아요. 잠시 후 다시 시도해주세요." };
  if (await store.hasOpenReport(postId, who)) return { ok: true, message: "이미 접수된 신고예요. 확인 후 조치할게요." };
  if ((await store.countRecentReports(who, new Date(Date.now() - 3_600_000).toISOString())) >= 8) {
    return { ok: false, message: "신고가 너무 많아요. 잠시 후 다시 시도해주세요." };
  }

  await store.createReport({
    postId,
    reporterId: user?.id ?? null,
    reporterAnon: anonId,
    reason,
    detail: detail.trim().slice(0, 500) || null,
  });
  return { ok: true, message: "신고가 접수됐어요. 운영자가 확인 후 조치할게요." };
}

/** 닉네임 변경 */
export async function updateNicknameAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  const nickname = String(formData.get("nickname") ?? "").replace(/\s+/g, " ").trim();
  if (nickname.length < 2 || nickname.length > 16) return { ok: false, message: "닉네임은 2~16자로 입력해주세요." };
  if (!/^[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ_\- ]+$/.test(nickname)) return { ok: false, message: "한글, 영문, 숫자, _ - 만 사용할 수 있어요." };
  await store.updateNickname(user.id, nickname);
  revalidatePath("/mypage");
  return { ok: true, message: "닉네임이 변경됐어요." };
}
