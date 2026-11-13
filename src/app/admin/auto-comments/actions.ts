"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
export async function saveAutoComments(_: { ok: boolean; message: string }, form: FormData) {
  await requireAdmin();
  const daily = Number(form.get("daily_limit"));
  if (!Number.isInteger(daily) || daily < 1 || daily > 50) return { ok: false, message: "일일 한도는 1~50입니다." };
  try {
    const { data, error } = await getAdminClient().from("auto_comment_settings").update({ enabled: form.get("enabled") === "on", daily_limit: daily }).eq("id", true).select("id").single();
    if (error || !data) return { ok: false, message: "저장하지 못했습니다. DB 설정을 확인해주세요." };
  } catch { return { ok: false, message: "저장소 연결을 확인해주세요." }; }
  revalidatePath("/admin/auto-comments");
  return { ok: true, message: "설정을 저장했습니다." };
}
