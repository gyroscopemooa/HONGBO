"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseThreadsModeration, type ThreadsActionState } from "@/lib/threads-admin-validation";

export async function saveThreadsSettings(_: ThreadsActionState, form: FormData): Promise<ThreadsActionState> {
  await requireAdmin();
  const daily = Number(form.get("daily_limit"));
  if (!Number.isInteger(daily) || daily < 1 || daily > 20) return { ok: false, message: "일일 한도는 1~20입니다." };
  try {
    const { data, error } = await getAdminClient().from("threads_promotion_settings").update({
      enabled: form.get("enabled") === "on", use_ai: form.get("use_ai") === "on", daily_limit: daily,
    }).eq("id", true).select("id").single();
    if (error || !data) return { ok: false, message: "설정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요." };
  } catch {
    return { ok: false, message: "저장소에 연결하지 못했습니다. 잠시 후 다시 시도해주세요." };
  }
  revalidatePath("/admin/threads");
  return { ok: true, message: "설정을 저장했습니다." };
}
export async function moderateThreadsPost(_: ThreadsActionState, form: FormData): Promise<ThreadsActionState> {
  const user = await requireAdmin();
  const input = parseThreadsModeration(form);
  if ("error" in input) return { ok: false, message: input.error! };
  try {
    const { error } = await getAdminClient().rpc("threads_moderate", {
      p_post_id: input.id, p_actor: user.id, p_hash: input.hash, p_excluded: input.excluded,
    });
    if (error) return { ok: false, message: "처리하지 못했습니다. 원문 또는 동의 상태가 바뀌었을 수 있습니다. 새로고침 후 다시 확인해주세요." };
  } catch {
    return { ok: false, message: "처리 결과를 확인하지 못했습니다. 새로고침하여 상태를 확인해주세요." };
  }
  revalidatePath("/admin/threads");
  return { ok: true, message: input.excluded ? "자동 홍보에서 제외했습니다." : "검토를 승인했습니다. 실제 게시 상태는 아래 처리 내역에서 확인해주세요." };
}
export async function retryThreadsPost(_: ThreadsActionState, form: FormData): Promise<ThreadsActionState> {
  await requireAdmin();
  const id = Number(form.get("post_id"));
  if (!Number.isSafeInteger(id) || id < 1) return { ok: false, message: "잘못된 요청입니다." };
  try {
    const { data, error } = await getAdminClient().rpc("threads_retry", { p_post_id: id });
    if (error || data !== true) return { ok: false, message: "재시도할 수 없습니다. 게시 요청 이력이 있거나 이미 처리된 글입니다. 처리 내역을 확인해주세요." };
  } catch {
    return { ok: false, message: "처리 결과를 확인하지 못했습니다. 새로고침하여 상태를 확인해주세요." };
  }
  revalidatePath("/admin/threads");
  return { ok: true, message: "안전한 단계부터 재시도하도록 예약했습니다." };
}
