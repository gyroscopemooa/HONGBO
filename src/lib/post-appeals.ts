import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";

export const DEFAULT_MODERATION_REASON = "내부 운영정책에 의한 숨김 및 차단";
export const APPEAL_STATES: Record<string, string> = { restricted: "보완 후 이의제기 가능", pending: "관리자 검토 중", revision: "추가 보완 요청", pdf_requested: "2차 복원 신청 필요", approved: "복원 승인", rejected: "1차 비승인 · 2차 복원 신청 필요" };
export type Appeal = { post_id: number; reason: string; state: string; appeal: string; response: string; version: number; updated_at: string; events: Array<{at: string; action: string; text: string}> };
export async function getAppealStates(ids: number[]): Promise<Record<number, string>> {
  if (!ids.length) return {};
  const { data, error } = await getAdminClient().from("post_appeals").select("post_id,state").in("post_id", ids);
  if (error) throw new Error("이의제기 상태 조회에 실패했습니다.");
  return Object.fromEntries((data ?? []).map(row => [row.post_id, row.state]));
}

// Callers must authenticate and check owner/admin before accessing private records.
export async function getAppeal(id: number): Promise<Appeal | null> {
  const { data, error } = await getAdminClient().from("post_appeals").select("*").eq("post_id", id).maybeSingle();
  if (error) throw new Error("이의제기 저장소를 확인할 수 없습니다. 관리자에게 문의해주세요.");
  return data as Appeal | null;
}
export async function transitionAppeal(id: number, actor: string, action: string, text: string, version?: number, sourceUpdated?: string) {
  const { error } = await getAdminClient().rpc("post_appeal_transition", { p_post: id, p_actor: actor, p_action: action, p_text: text, p_version: version ?? null, p_source_updated: sourceUpdated ?? null });
  if (error) throw new Error("처리하지 못했습니다. 글이나 신청 상태가 변경됐을 수 있으니 새로고침 후 확인해주세요.");
}
