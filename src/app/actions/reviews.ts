"use server";

import { revalidatePath } from "next/cache";
import { ensureAnonId } from "@/lib/anon";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { countReviewsSince, createReview, createReviewReport, deleteReview, getReview, hasRecentReviewForTarget, reviewStorageReady } from "@/lib/review-store";
import { parseReviewInput, REVIEW_REPORT_REASONS, type ReviewInput } from "@/lib/reviews";

export type ReviewResult = { ok: true; id?: number; message?: string } | { ok: false; message: string; login?: boolean };

export async function createReviewAction(raw: ReviewInput): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "로그인이 필요해요.", login: true };
  if (user.status === "blocked") return { ok: false, message: "작성이 제한된 계정이에요. 문의하기로 연락해주세요." };

  const parsed = parseReviewInput(raw);
  if (!parsed.ok) return { ok: false, message: parsed.message };
  if (!(await reviewStorageReady())) return { ok: false, message: "후기 게시판 저장소가 아직 준비되지 않았어요. 관리자에게 문의해주세요." };

  const tenMin = new Date(Date.now() - 10 * 60_000).toISOString();
  if ((await countReviewsSince(user.id, tenMin)) >= 3) return { ok: false, message: "짧은 시간에 너무 많이 올렸어요. 잠시 뒤에 다시 시도해주세요." };
  const oneDay = new Date(Date.now() - 24 * 3_600_000).toISOString();
  if (await hasRecentReviewForTarget(user.id, parsed.data.targetName, oneDay)) {
    return { ok: false, message: "같은 업체·서비스에는 하루에 한 번만 후기를 올릴 수 있어요." };
  }

  const id = await createReview({ ...parsed.data, authorId: user.id, nickname: user.nickname });
  revalidatePath("/reviews");
  return { ok: true, id };
}

export async function deleteReviewAction(id: number): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "로그인이 필요해요.", login: true };
  const review = await getReview(id);
  if (!review) return { ok: false, message: "글을 찾을 수 없어요." };
  if (review.authorId !== user.id && !user.isAdmin) return { ok: false, message: "삭제 권한이 없어요." };
  await deleteReview(id);
  revalidatePath("/reviews");
  return { ok: true };
}

export async function reportReviewAction(id: number, reason: string, detail: string): Promise<ReviewResult> {
  if (!(reason in REVIEW_REPORT_REASONS)) return { ok: false, message: "신고 사유를 선택해주세요." };
  const review = await getReview(id);
  if (!review) return { ok: false, message: "글을 찾을 수 없어요." };
  const anonId = await ensureAnonId();
  if (!rateLimit(`review-report:${anonId}`, 8, 3_600_000)) return { ok: false, message: "신고가 너무 많아요. 잠시 후 다시 시도해주세요." };
  const user = await getCurrentUser();
  const result = await createReviewReport({
    reviewId: id,
    reporterId: user?.id ?? null,
    reporterAnon: anonId,
    reason,
    detail: detail.trim().slice(0, 500) || null,
  });
  return { ok: true, message: result === "duplicate" ? "이미 접수된 신고예요. 확인 후 조치할게요." : "신고가 접수됐어요. 운영자가 확인 후 조치할게요." };
}
