"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { communitySchema } from "@/lib/community";
import { getCommunity, saveCommunity } from "@/lib/community-store";

export async function saveCommunityAction(_previous: { error: string }, form: FormData) {
  const user = await requireAdmin();
  if (user.status !== "active") return { error: "이 계정으로는 글을 저장할 수 없습니다." };
  const value = (key: string) => String(form.get(key) ?? "");
  const links = value("links").split("\n").filter(line => line.trim()).map(line => {
    const split = line.indexOf("|");
    return { label: split < 0 ? "" : line.slice(0, split).trim(), url: split < 0 ? line.trim() : line.slice(split + 1).trim() };
  });
  const parsed = communitySchema.safeParse({ ...Object.fromEntries(form), links, service: value("serviceUrl") || value("serviceLabel") ? { label: value("serviceLabel"), url: value("serviceUrl") } : null });
  if (!parsed.success) return { error: `입력 내용을 확인해 주세요: ${parsed.error.issues[0].path.join(".")} — ${parsed.error.issues[0].message}` };
  let id: string;
  try {
    const existing = value("id") ? await getCommunity(value("id"), true) : null;
    if (value("id") && !existing) return { error: "수정할 글을 찾을 수 없습니다." };
    id = await saveCommunity(parsed.data, existing);
  } catch { return { error: "저장하지 못했습니다. 데이터베이스 연결과 커뮤니티 마이그레이션 적용 여부를 확인해 주세요. 입력 내용은 유지됩니다." }; }
  revalidatePath("/community", "layout");
  revalidatePath("/admin/community");
  revalidatePath("/sitemap.xml");
  redirect(`/admin/community/${id}?saved=1`);
}
