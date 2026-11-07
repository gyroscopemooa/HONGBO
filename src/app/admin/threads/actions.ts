"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export async function saveThreadsSettings(form: FormData) {
  await requireAdmin();
  const daily = Number(form.get("daily_limit"));
  if (!Number.isInteger(daily) || daily < 1 || daily > 20) throw new Error("일일 한도는 1~20입니다.");
  // A separate deployment variable remains a hard OFF switch until final approval.
  const { error } = await getAdminClient().from("threads_promotion_settings").update({
    enabled: form.get("enabled") === "on", use_ai: form.get("use_ai") === "on", daily_limit: daily,
  }).eq("id", true);
  if (error) throw new Error("설정을 저장하지 못했습니다. 마이그레이션 적용 상태를 확인해주세요.");
  revalidatePath("/admin/threads");
}
export async function moderateThreadsPost(form: FormData) {
  const user = await requireAdmin();
  const id = Number(form.get("post_id"));
  const hash = String(form.get("hash") ?? "");
  const excluded = form.get("decision") === "exclude";
  if (!Number.isSafeInteger(id) || id < 1 || !/^[a-f0-9]{32}$/.test(hash)) throw new Error("잘못된 요청입니다.");
  if (!excluded && form.get("reviewed") !== "on") throw new Error("개인정보·민감정보 검토 확인이 필요합니다.");
  const { error } = await getAdminClient().rpc("threads_moderate", {
    p_post_id: id, p_actor: user.id, p_hash: hash, p_excluded: excluded,
  });
  if (error) throw new Error("원문 또는 동의 상태가 바뀌었습니다. 새로고침 후 확인해주세요.");
  revalidatePath("/admin/threads");
}
export async function retryThreadsPost(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("post_id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("잘못된 요청입니다.");
  const { data, error } = await getAdminClient().rpc("threads_retry", { p_post_id: id });
  if (error || data !== true) throw new Error("재시도할 수 없습니다. 게시 요청 이력이 있거나 이미 처리된 글입니다.");
  revalidatePath("/admin/threads");
}
