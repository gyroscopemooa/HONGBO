"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AD_KIND_LABEL, AD_PLANS, adPrice, depositorName, won } from "@/lib/ads";
import { parseCreative } from "@/lib/ad-creative";
import { getCurrentUser } from "@/lib/auth";
import { isPostPublic } from "@/lib/queries";
import { notifyAdmin } from "@/lib/notify";
import { store } from "@/lib/store";
import type { Ad } from "@/lib/types";

/** 광고 신청 — 로그인한 작성자가 본인의 공개 글로 신청합니다. 승인(입금 확인)은 운영자가 합니다. */
export async function requestAdAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=%2Fadvertise");
  if (user.status === "blocked") redirect("/advertise?error=" + encodeURIComponent("신청이 제한된 계정이에요. 문의하기로 연락해주세요."));

  const postId = Number.parseInt(String(formData.get("postId") ?? ""), 10);
  const kind = String(formData.get("kind")) as Ad["kind"];
  const plan = String(formData.get("plan")) as Ad["plan"];
  const fail = (m: string): never => redirect("/advertise?error=" + encodeURIComponent(m));

  if (!Number.isFinite(postId)) fail("광고할 홍보글을 선택해주세요.");
  if (!["premium", "banner"].includes(kind)) fail("광고 상품을 선택해주세요.");
  if (!(plan in AD_PLANS)) fail("기간을 선택해주세요.");

  const parsed = parseCreative(String(formData.get("creative") ?? ""), kind);
  if (!parsed.ok) fail(parsed.error);
  const creative = parsed.ok ? parsed.creative : null;

  const post = await store.getPost(postId);
  if (!post || post.authorId !== user.id) fail("내가 쓴 홍보글만 광고로 신청할 수 있어요.");
  if (!post || !isPostPublic(post)) fail("현재 공개 중인 홍보글만 신청할 수 있어요.");

  let adId = 0;
  try {
    const mine = await store.listAds({ requestedBy: user.id });
    if (mine.some((a) => a.postId === postId && a.kind === kind)) {
      fail("이 글은 같은 상품으로 이미 신청했거나 노출 중이에요. 아래 신청 내역을 확인해주세요.");
    }
    adId = (await store.requestAd({ postId, kind, plan, requestedBy: user.id, creative })).id;
  } catch (e) {
    // redirect() 는 예외로 동작하므로 그대로 다시 던집니다.
    if (e && typeof e === "object" && "digest" in e) throw e;
    fail("지금은 신청을 받을 수 없어요. 잠시 후 다시 시도하거나 이메일로 문의해주세요.");
  }
  revalidatePath("/advertise");
  revalidatePath("/admin/ads");
  // 운영자에게 알림 메일 (설정이 없거나 실패해도 신청은 그대로 접수됩니다)
  await notifyAdmin(`[더홍보] 광고 신청 · ${AD_KIND_LABEL[kind]} ${AD_PLANS[plan].label}`, [
    `새 광고 신청이 들어왔어요. 입금을 확인한 뒤 관리자 > 광고에서 승인해주세요.`,
    ``,
    `글: #${postId} ${post?.title ?? ""}`,
    `상품: ${AD_KIND_LABEL[kind]} · ${AD_PLANS[plan].label}`,
    `금액: ${won(adPrice({ kind, plan }))}`,
    `입금자명: ${depositorName(adId)}`,
    `신청자: ${user.nickname}${user.email ? ` (${user.email})` : ""}`,
    creative ? `배너 제작: ${creative.mode === "upload" ? "완성 이미지 업로드" : "직접 만들기"} (승인 전 확인 필요)` : "",
  ].join(String.fromCharCode(10)));
  redirect(`/advertise?requested=${adId}`);
}
