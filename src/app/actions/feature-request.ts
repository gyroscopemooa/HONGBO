"use server";

import { ensureAnonId } from "@/lib/anon";
import { getCurrentUser } from "@/lib/auth";
import { createFeatureRequest } from "@/lib/feature-requests";
import { rateLimit } from "@/lib/ratelimit";

export async function submitFeatureRequestAction(message: string, contact: string, page: string): Promise<{ ok: boolean; message: string }> {
  const text = message.trim();
  if (text.length < 5) return { ok: false, message: "요청 내용을 5자 이상 적어주세요." };
  if (text.length > 1000) return { ok: false, message: "요청 내용은 1000자 이내로 적어주세요." };

  const anonId = await ensureAnonId();
  if (!rateLimit(`feature:${anonId}`, 5, 3_600_000)) return { ok: false, message: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." };

  const user = await getCurrentUser();
  try {
    await createFeatureRequest({
      message: text,
      contact: contact.trim().slice(0, 100) || null,
      page: page.startsWith("/") ? page.slice(0, 200) : null,
      reporterId: user?.id ?? null,
      reporterAnon: anonId,
    });
  } catch (error) {
    console.error("feature request failed", error);
    return { ok: false, message: "지금은 접수할 수 없어요. 문의하기로 보내주세요." };
  }
  return { ok: true, message: "소중한 의견 고마워요. 운영자가 확인할게요." };
}
