"use server";

import { revalidatePath } from "next/cache";
import { ensureAnonId } from "@/lib/anon";
import { getCurrentUser } from "@/lib/auth";
import { SURVEY_ANSWER_MAX, SURVEY_MAX_QUESTIONS } from "@/lib/constants";
import { isPostPublic } from "@/lib/queries";
import { rateLimit } from "@/lib/ratelimit";
import { store } from "@/lib/store";
import { saveSurveyResponse, type SurveyAnswer } from "@/lib/survey-store";

export interface SurveySubmitResult {
  ok: boolean;
  message: string;
}

/** 로그인하지 않아도 참여 가능. 질문 정의는 반드시 서버에 저장된 게시글에서 읽습니다. */
export async function submitSurveyAction(postId: number, raw: unknown): Promise<SurveySubmitResult> {
  if (!Number.isSafeInteger(postId) || postId <= 0) return { ok: false, message: "잘못된 설문 주소예요." };
  const post = await store.getPost(postId);
  const exclusive = post?.extra.exclusive;
  if (!post || !isPostPublic(post) || exclusive?.method !== "survey" || !exclusive.survey?.length) {
    return { ok: false, message: "지금은 참여할 수 없는 설문이에요." };
  }

  const user = await getCurrentUser();
  if (user?.status === "blocked") return { ok: false, message: "참여가 제한된 계정이에요." };
  if (user && user.id === post.authorId) return { ok: false, message: "자신의 설문에는 참여할 수 없어요." };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, message: "응답을 확인해주세요." };
  const incoming = raw as Record<string, unknown>;
  const questions = exclusive.survey;
  if (questions.length > SURVEY_MAX_QUESTIONS || Object.keys(incoming).length > SURVEY_MAX_QUESTIONS) {
    return { ok: false, message: "설문 응답이 너무 많아요." };
  }
  if (Object.keys(incoming).some((key) => !questions.some((q) => q.id === key))) {
    return { ok: false, message: "설문 항목이 달라졌어요. 새로고침 후 다시 제출해주세요." };
  }

  const answers: SurveyAnswer[] = [];
  for (const question of questions) {
    const value = incoming[question.id] ?? "";
    if (typeof value !== "string" || value.length > SURVEY_ANSWER_MAX) {
      return { ok: false, message: "답변은 500자 이내로 작성해주세요." };
    }
    const answer = value.trim();
    if (question.required && !answer) return { ok: false, message: `"${question.title}" 질문에 답변해주세요.` };
    if (question.type === "choice" && answer && !question.options?.includes(answer)) {
      return { ok: false, message: "선택지가 변경됐어요. 새로고침 후 다시 제출해주세요." };
    }
    if (answer) answers.push({ id: question.id, question: question.title, answer });
  }

  const anonId = await ensureAnonId();
  if (!rateLimit(`survey:${anonId}`, 5, 60_000)) return { ok: false, message: "잠시 후 다시 시도해주세요." };

  try {
    const result = await saveSurveyResponse(postId, anonId, user?.id ?? null, answers);
    if (result === "duplicate") return { ok: false, message: "이미 이 설문에 참여하셨어요. 한 번만 제출할 수 있어요." };
    revalidatePath(`/post/${postId}/survey-results`);
    return { ok: true, message: "설문 참여가 완료됐어요. 참여해 주셔서 감사합니다!" };
  } catch {
    return { ok: false, message: "응답을 저장하지 못했어요. 설문 설정을 확인하거나 잠시 후 다시 시도해주세요." };
  }
}
