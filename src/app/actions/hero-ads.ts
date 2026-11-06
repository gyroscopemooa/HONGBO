"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { heroDepositor, heroPrice, HERO_PLANS, parseHeroAdInput } from "@/lib/hero-ads";
import { won } from "@/lib/ads";
import { listHeroAds, requestHeroAd } from "@/lib/hero-ad-store";
import { notifyAdmin } from "@/lib/notify";

const fail = (m: string): never => redirect("/advertise?error=" + encodeURIComponent(m) + "#hero-ad");

/** 홈 슬라이드 광고 신청 — 로그인한 회원이 신청하고, 입금 확인 후 운영자가 승인합니다. */
export async function requestHeroAdAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=%2Fadvertise");
  if (user.status === "blocked") fail("신청이 제한된 계정이에요. 문의하기로 연락해주세요.");

  const parsed = parseHeroAdInput((k) => String(formData.get(k) ?? ""));
  if (!parsed.ok) fail(parsed.error);
  if (!parsed.ok) return;

  let adId = 0;
  try {
    const mine = await listHeroAds({ requestedBy: user.id, status: "requested" });
    if (mine.length >= 3) fail("입금 대기 중인 신청이 3건 있어요. 먼저 처리한 뒤 다시 신청해주세요.");
    adId = (await requestHeroAd({ ...parsed.data, requestedBy: user.id })).id;
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    fail("지금은 신청을 받을 수 없어요. 잠시 후 다시 시도하거나 이메일로 문의해주세요.");
  }
  revalidatePath("/advertise");
  revalidatePath("/admin/hero-ads");
  const d = parsed.data;
  await notifyAdmin(`[더홍보] 홈 슬라이드 광고 신청 · ${HERO_PLANS[d.plan].label}`, [
    "새 홈 슬라이드 광고 신청이 들어왔어요. 입금을 확인한 뒤 관리자 > 슬라이드 광고에서 승인해주세요.",
    "",
    `금액: ${won(heroPrice(d.plan))}`,
    `입금자명: ${heroDepositor(adId)}`,
    `제작: ${d.designMode === "template" ? "템플릿 디자인" : d.designMode === "image" ? "직접 만든 이미지" : "협의 후 제작"}`,
    `링크: ${d.linkMode === "url" ? d.linkUrl : "협의 후 결정"}`,
    `신청자: ${user.nickname}${user.email ? ` (${user.email})` : ""}`,
    d.memo ? `메모: ${d.memo}` : "",
  ].join(String.fromCharCode(10)));
  redirect(`/advertise?heroRequested=${adId}#hero-ad`);
}
