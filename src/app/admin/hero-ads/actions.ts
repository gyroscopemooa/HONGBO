"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { activateHeroAd, deleteHeroAd, setHeroAdLink } from "@/lib/hero-ad-store";
import { normalizeExternalUrl } from "@/lib/url";

const back = (error?: string): never => redirect(error ? `/admin/hero-ads?error=${encodeURIComponent(error)}` : "/admin/hero-ads");
const refresh = () => {
  revalidatePath("/");
  revalidatePath("/admin/hero-ads");
  revalidatePath("/advertise");
};
const idOf = (fd: FormData) => Number.parseInt(String(fd.get("id") ?? ""), 10);

export async function adminApproveHeroAd(formData: FormData) {
  await requireAdmin();
  const id = idOf(formData);
  if (!Number.isFinite(id)) return;
  // 협의로 정한 링크가 있으면 승인과 함께 넣어요.
  const rawLink = String(formData.get("linkUrl") ?? "").trim();
  if (rawLink) {
    const u = normalizeExternalUrl(rawLink);
    if (!u.ok || !u.url) back(u.error ?? "링크 주소를 확인해주세요.");
    else await setHeroAdLink(id, u.url);
  }
  const r = await activateHeroAd(id);
  refresh();
  back(r.ok ? undefined : r.error);
}

export async function adminDeleteHeroAd(formData: FormData) {
  await requireAdmin();
  const id = idOf(formData);
  if (!Number.isFinite(id)) return;
  await deleteHeroAd(id);
  refresh();
  back();
}

/** 노출 중에도 링크만 넣거나 바꿀 수 있어요. */
export async function adminSetHeroAdLink(formData: FormData) {
  await requireAdmin();
  const id = idOf(formData);
  if (!Number.isFinite(id)) return;
  const u = normalizeExternalUrl(String(formData.get("linkUrl") ?? "").trim());
  if (!u.ok || !u.url) back(u.error ?? "링크 주소를 확인해주세요.");
  else await setHeroAdLink(id, u.url);
  refresh();
  back();
}
