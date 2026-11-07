import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { needsThreadsReview } from "../../automation/threads/src/screen.mjs";

/** Caller must authenticate the actor. RPC independently verifies post ownership. */
export async function setThreadsConsent(postId: number, actorId: string, consent: boolean) {
  const db = getAdminClient();
  const saved = await db.rpc("threads_consent", { p_post_id: postId, p_actor: actorId, p_consent: consent });
  if (saved.error) throw new Error("SNS 홍보 동의 저장에 실패했습니다.");
  if (!consent) return;
  const version = await db.from("threads_promotion_permissions").update({ consent_version: "threads-v2-auto" }).eq("post_id", postId).eq("author_id", actorId);
  if (version.error) throw new Error("SNS 동의 버전 저장에 실패했습니다.");
  await screenThreadsPost(postId);
}

/** Does not grant consent, clear exclusions, or authorize a changed source snapshot. */
export async function screenThreadsPost(postId: number) {
  const db = getAdminClient();
  const { data: consent, error: consentError } = await db.from("threads_promotion_permissions").select("*").eq("post_id", postId).maybeSingle();
  if (consentError) throw new Error("SNS 동의 조회에 실패했습니다.");
  if (!consent?.consent_at || consent.excluded || consent.consent_version !== "threads-v2-auto") return;
  const { data: post, error } = await db.from("posts").select("*").eq("id", postId).single();
  if (error || !post || post.author_id !== consent.author_id) throw new Error("SNS 원문 확인에 실패했습니다.");
  if (post.status !== "active" || post.is_seed || needsThreadsReview(post)) return;
  const hash = await db.rpc("threads_source_hash", { p: post });
  if (hash.error || !hash.data) throw new Error("SNS 원문 검증에 실패했습니다.");
  // Compare consent snapshot; never clear a concurrent withdrawal or admin exclusion.
  // Queue/prepare RPCs compare this hash to the current source before publication.
  const approved = await db.from("threads_promotion_permissions").update({ approved_hash: hash.data, approved_at: new Date().toISOString(), approved_by: null })
    .eq("post_id", postId).eq("author_id", consent.author_id).eq("excluded", false)
    .eq("consent_at", consent.consent_at).eq("consent_version", "threads-v2-auto");
  if (approved.error) throw new Error("SNS 자동 검사 결과 저장에 실패했습니다.");
}
