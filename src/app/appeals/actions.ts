"use server";
import { requireUser, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { transitionAppeal } from "@/lib/post-appeals";
import { store } from "@/lib/store";

function values(form: FormData) {
  const id = Number(form.get("id"));
  const version = Number(form.get("version"));
  const text = String(form.get("text") ?? "").trim();
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(version) || version < 0) throw new Error("잘못된 요청입니다.");
  return { id, version, text };
}
export async function submitAppeal(form: FormData) {
  const user = await requireUser("/mypage");
  const { id, version, text } = values(form);
  if (text.length < 30 || text.length > 5000) throw new Error("수정 내용과 요청 사유를 30~5,000자로 작성해주세요.");
  const post = await store.getPost(id);
  if (!post || post.authorId !== user.id || !["hidden", "blocked"].includes(post.status)) throw new Error("신청할 수 없는 글입니다.");
  await transitionAppeal(id, user.id, "submit", text, version);
  revalidatePath("/", "layout");
  redirect(`/appeals/${id}`);
}
export async function reviewAppeal(form: FormData) {
  const admin = await requireAdmin();
  const { id, version, text } = values(form);
  const action = String(form.get("decision"));
  if (!["approve", "revision", "pdf_requested", "reject"].includes(action) || text.length > 2000) throw new Error("잘못된 검토 요청입니다.");
  const response = text || (action === "approve" ? "보완 내용을 확인하여 복원 승인했습니다." : ["pdf_requested", "reject"].includes(action) ? "1차 내용만으로는 복원하기 어렵습니다. 복원 신청하기에서 2차 PDF 신청서와 확인 자료를 작성하여 지원 메일로 보내주세요." : "요청 사유와 보완 내용을 다시 구체적으로 작성해주세요.");
  await transitionAppeal(id, admin.id, action, response, version, String(form.get("sourceUpdated") ?? ""));
  revalidatePath("/", "layout");
  redirect("/admin/appeals");
}
