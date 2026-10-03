"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { normalizeExternalUrl } from "@/lib/url";
import type { Banner, PostStatus } from "@/lib/types";

// 모든 관리자 액션은 시작할 때 반드시 관리자 여부를 서버에서 다시 확인합니다.

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

const int = (v: FormDataEntryValue | null): number | null => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
};

export async function adminSetPostStatus(formData: FormData) {
  await requireAdmin();
  const id = int(formData.get("id"));
  const status = String(formData.get("status")) as PostStatus;
  if (!id || !["active", "hidden", "blocked"].includes(status)) return;
  await store.setPostStatus(id, status);
  refresh();
}

export async function adminDeletePost(formData: FormData) {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (!id) return;
  await store.deletePost(id);
  refresh();
}

export async function adminPinPost(formData: FormData) {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (!id) return;
  const pinned = formData.get("pinned") === "on";
  const rank = int(formData.get("rank"));
  await store.setPinned(id, pinned, rank && rank > 0 ? rank : null);
  refresh();
}

export async function adminBulkSeed(formData: FormData) {
  await requireAdmin();
  const action = String(formData.get("action"));
  if (action !== "hide" && action !== "show" && action !== "delete") return;
  await store.bulkSeed(action);
  refresh();
}

export async function adminHandleReport(formData: FormData) {
  await requireAdmin();
  const id = int(formData.get("id"));
  const postId = int(formData.get("postId"));
  const decision = String(formData.get("decision"));
  if (!id) return;
  if (decision === "resolve_hide" && postId) {
    await store.setPostStatus(postId, "hidden");
    await store.setReportStatus(id, "resolved");
  } else if (decision === "resolve") {
    await store.setReportStatus(id, "resolved");
  } else if (decision === "reject") {
    await store.setReportStatus(id, "rejected");
  } else if (decision === "reopen") {
    await store.setReportStatus(id, "open");
  }
  refresh();
}

export async function adminSetUserStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status"));
  if (!id || id === admin.id || (status !== "active" && status !== "blocked")) return;
  await store.setProfileStatus(id, status);
  refresh();
}

function validTarget(v: string): string | null {
  const s = v.trim();
  if (s.startsWith("/") && !s.startsWith("//") && !s.includes("\\")) return s;
  const r = normalizeExternalUrl(s);
  return r.ok ? r.url : null;
}

export async function adminSaveBanner(formData: FormData) {
  await requireAdmin();
  const id = int(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  const subtitle = String(formData.get("subtitle") ?? "").trim().slice(0, 80);
  const target = validTarget(String(formData.get("targetUrl") ?? ""));
  const imageRaw = String(formData.get("imageUrl") ?? "").trim();
  const image = imageRaw ? validTarget(imageRaw) : null;
  const placement = String(formData.get("placement")) as Banner["placement"];
  const theme = String(formData.get("theme")) as Banner["theme"];
  if (!title || !target) return;
  if (!["side", "strip"].includes(placement)) return;
  if (!["coral", "blue", "mint", "violet", "amber"].includes(theme)) return;
  await store.saveBanner({
    ...(id ? { id } : {}),
    title,
    subtitle: subtitle || null,
    imageUrl: image,
    targetUrl: target,
    placement,
    theme,
    sortOrder: int(formData.get("sortOrder")) ?? 0,
    isActive: formData.get("isActive") === "on",
  });
  refresh();
}

export async function adminDeleteBanner(formData: FormData) {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (!id) return;
  await store.deleteBanner(id);
  refresh();
}

export async function adminSaveNotice(formData: FormData) {
  await requireAdmin();
  const id = int(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim().slice(0, 100);
  const body = String(formData.get("body") ?? "").trim().slice(0, 3000);
  if (!title) return;
  await store.saveNotice({ ...(id ? { id } : {}), title, body, isPinned: formData.get("isPinned") === "on" });
  refresh();
}

export async function adminDeleteNotice(formData: FormData) {
  await requireAdmin();
  const id = int(formData.get("id"));
  if (!id) return;
  await store.deleteNotice(id);
  refresh();
}
