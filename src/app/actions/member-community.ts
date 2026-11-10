"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { memberPostSchema, type MemberResult } from "@/lib/member-community";
import * as db from "@/lib/member-community-store";
import { findBannedKeyword } from "@/lib/policy";
import { rateLimit } from "@/lib/ratelimit";
import { store } from "@/lib/store";
async function actor() {
  const user = await getCurrentUser();
  if (!user)
    return {
      error: {
        ok: false,
        message: "로그인이 필요해요.",
        login: true,
      } as MemberResult,
    };
  if (user.status === "blocked")
    return {
      error: {
        ok: false,
        message: "이용이 제한된 계정이에요.",
      } as MemberResult,
    };
  return { user };
}
function refresh(id?: number) {
  revalidatePath("/talk");
  revalidatePath("/talk/notifications");
  revalidatePath("/admin/talk");
  if (id) revalidatePath(`/talk/${id}`);
}
const failure = (): MemberResult => ({
  ok: false,
  message: "요청을 처리하지 못했어요. 잠시 뒤 다시 시도해주세요.",
});
export async function saveMemberPostAction(
  input: unknown,
  id?: number,
): Promise<MemberResult> {
  const auth = await actor();
  if (auth.error) return auth.error;
  const user = auth.user!;
  const parsed = memberPostSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력을 확인해주세요.",
    };
  const p = parsed.data;
  if (
    findBannedKeyword(p.title, p.body, ...Object.values(p.details).map(String))
  )
    return {
      ok: false,
      message: "운영정책상 등록할 수 없는 내용이 포함되어 있어요.",
    };
  try {
    if (id !== undefined) {
      const old = await db.getMemberPost(id, true);
      if (
        !old ||
        (old.authorId !== user.id && !user.isAdmin) ||
        old.status !== "active"
      )
        return { ok: false, message: "수정할 수 없는 글이에요." };
    }
    if (p.details.promotionId) {
      const linked = await store.getPost(p.details.promotionId);
      if (
        !linked ||
        linked.status !== "active" ||
        (linked.authorId !== user.id && !user.isAdmin)
      )
        return { ok: false, message: "내 공개 홍보글만 연결할 수 있어요." };
    }
    if (!rateLimit(`member-post:${user.id}`, 5, 600000))
      return { ok: false, message: "잠시 뒤 다시 작성해주세요." };
    const result = await db.saveMemberPost(p, user.id, user.nickname, id);
    refresh(result);
    return { ok: true, id: result };
  } catch {
    return failure();
  }
}
export async function setMemberPostStateAction(
  id: number,
  action: "close" | "reopen" | "delete" | "hide" | "restore",
): Promise<MemberResult> {
  const auth = await actor();
  if (auth.error) return auth.error;
  const user = auth.user!;
  if (!["close", "reopen", "delete", "hide", "restore"].includes(action))
    return failure();
  try {
    const p = await db.getMemberPost(id, true);
    if (!p || (p.authorId !== user.id && !user.isAdmin))
      return { ok: false, message: "변경 권한이 없어요." };
    if (["hide", "restore"].includes(action) && !user.isAdmin)
      return { ok: false, message: "관리자만 변경할 수 있어요." };
    if (
      p.status === "deleted" ||
      (action === "restore" && p.status !== "hidden") ||
      (["hide", "close", "reopen"].includes(action) && p.status !== "active")
    )
      return { ok: false, message: "변경할 수 없는 글이에요." };
    await db.setMemberPostState(
      id,
      action === "close"
        ? { closed: true }
        : action === "reopen"
          ? { closed: false }
          : {
              status:
                action === "hide"
                  ? "hidden"
                  : action === "restore"
                    ? "active"
                    : "deleted",
            },
      p.status,
    );
    refresh(id);
    return { ok: true };
  } catch {
    return failure();
  }
}
export async function addMemberCommentAction(
  postId: number,
  body: string,
  parentId?: number,
): Promise<MemberResult> {
  const auth = await actor();
  if (auth.error) return auth.error;
  const user = auth.user!;
  if (typeof body !== "string" || !body.trim() || body.trim().length > 3000)
    return { ok: false, message: "댓글은 1~3,000자로 입력해주세요." };
  if (findBannedKeyword(body))
    return {
      ok: false,
      message: "댓글에 등록할 수 없는 내용이 포함되어 있어요.",
    };
  try {
    if (!(await db.getMemberPost(postId)))
      return { ok: false, message: "글을 찾을 수 없어요." };
    if ((await db.listMemberComments(postId)).length >= 1000)
      return {
        ok: false,
        message:
          "이 글은 댓글 한도(1,000개)에 도달했어요. 새 글에서 이야기를 이어주세요.",
      };
    if (parentId !== undefined) {
      const parent = await db.getMemberComment(parentId);
      if (
        !parent ||
        parent.postId !== postId ||
        parent.status !== "active" ||
        parent.parentId
      )
        return { ok: false, message: "답글 대상을 확인해주세요." };
    }
    if (!rateLimit(`member-comment:${user.id}`, 15, 60000))
      return { ok: false, message: "댓글 작성 간격을 두고 다시 시도해주세요." };
    const id = await db.addMemberComment(
      postId,
      user.id,
      user.nickname,
      body.trim(),
      parentId ?? null,
    );
    refresh(postId);
    return { ok: true, id };
  } catch {
    return failure();
  }
}
export async function deleteMemberCommentAction(
  id: number,
): Promise<MemberResult> {
  const auth = await actor();
  if (auth.error) return auth.error;
  const user = auth.user!;
  try {
    const c = await db.getMemberComment(id);
    if (!c || (c.authorId !== user.id && !user.isAdmin))
      return { ok: false, message: "삭제 권한이 없어요." };
    await db.deleteMemberComment(id);
    refresh(c.postId);
    return { ok: true };
  } catch {
    return failure();
  }
}
export async function reportMemberContentAction(
  postId: number,
  reason: string,
  commentId?: number,
): Promise<MemberResult> {
  const auth = await actor();
  if (auth.error) return auth.error;
  const user = auth.user!;
  if (
    typeof reason !== "string" ||
    reason.trim().length < 2 ||
    reason.length > 1000
  )
    return { ok: false, message: "신고 사유를 2~1,000자로 적어주세요." };
  try {
    if (!(await db.getMemberPost(postId)))
      return { ok: false, message: "글을 찾을 수 없어요." };
    if (commentId !== undefined) {
      const c = await db.getMemberComment(commentId);
      if (!c || c.postId !== postId || c.status !== "active")
        return { ok: false, message: "댓글을 찾을 수 없어요." };
    }
    if (!rateLimit(`member-report:${user.id}`, 5, 600000))
      return { ok: false, message: "잠시 후 다시 신고해주세요." };
    await db.reportMemberContent(
      postId,
      user.id,
      reason.trim(),
      commentId ?? null,
    );
    refresh(postId);
    return { ok: true };
  } catch {
    return failure();
  }
}
export async function markMemberNotificationsReadAction(): Promise<MemberResult> {
  const auth = await actor();
  if (auth.error) return auth.error;
  try {
    await db.markMemberNotificationsRead(auth.user!.id);
    refresh();
    return { ok: true };
  } catch {
    return failure();
  }
}

export async function applyMemberPostAction(
  postId: number,
  note: string,
): Promise<MemberResult> {
  const auth = await actor();
  if (auth.error) return auth.error;
  const user = auth.user!;
  if (typeof note !== "string" || note.trim().length > 1000)
    return { ok: false, message: "신청 메모는 1,000자 이내로 적어주세요." };
  try {
    const p = await db.getMemberPost(postId);
    if (
      !p ||
      p.closed ||
      !p.details.acceptApplications ||
      p.authorId === user.id
    )
      return {
        ok: false,
        message: "모집 중인 다른 회원의 글에만 신청할 수 있어요.",
      };
    if (!rateLimit(`member-apply:${user.id}`, 5, 600000))
      return { ok: false, message: "잠시 뒤 다시 신청해주세요." };
    const id = await db.applyMemberPost(
      postId,
      user.id,
      user.nickname,
      note.trim(),
    );
    refresh(postId);
    return { ok: true, id };
  } catch {
    return {
      ok: false,
      message:
        "이미 신청했거나 신청을 처리하지 못했어요. 현재 신청 상태를 확인해주세요.",
    };
  }
}
export async function cancelMemberApplicationAction(
  postId: number,
): Promise<MemberResult> {
  const auth = await actor();
  if (auth.error) return auth.error;
  try {
    await db.cancelMemberApplication(postId, auth.user!.id);
    refresh(postId);
    return { ok: true };
  } catch {
    return failure();
  }
}
export async function setMemberApplicationStatusAction(
  id: number,
  status: "accepted" | "declined",
): Promise<MemberResult> {
  const auth = await actor();
  if (auth.error) return auth.error;
  if (!["accepted", "declined"].includes(status)) return failure();
  try {
    const a = await db.getMemberApplication(id);
    const p = a ? await db.getMemberPost(a.postId) : null;
    if (!a || !p || (p.authorId !== auth.user!.id && !auth.user!.isAdmin))
      return { ok: false, message: "신청 관리 권한이 없어요." };
    if (a.status === "cancelled")
      return { ok: false, message: "취소된 신청은 변경할 수 없어요." };
    await db.setMemberApplicationStatus(id, status);
    refresh(p.id);
    return { ok: true };
  } catch {
    return failure();
  }
}
