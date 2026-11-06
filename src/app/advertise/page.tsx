import type { Metadata } from "next";
import Link from "next/link";
import { Crown, GalleryHorizontal } from "lucide-react";
import { requestAdAction } from "@/app/actions/ads";
import { AdRequestForm } from "@/components/AdRequestForm";
import { AD_BANK, AD_BANNER_SLOTS, AD_KIND_LABEL, AD_PAY_DAYS, AD_PLANS, AD_PREMIUM_SLOTS, AD_PRICES, adPrice, depositorName, won } from "@/lib/ads";
import type { Ad } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { contactEmail } from "@/lib/env";
import { isPostPublic } from "@/lib/queries";
import { store } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "광고 상품 - 메인 상단 고정·배너",
  description: "더홍보 메인 최상단에 내 홍보를 고정하거나 와이드 배너로 노출하는 광고 상품 안내입니다.",
  alternates: { canonical: "/advertise" },
};

export const dynamic = "force-dynamic";

const MAIL_BODY = ["광고할 홍보글 주소:", "희망 상품(프리미엄/배너):", "희망 기간(1주일/1개월):", "희망 시작일:", ""].join(String.fromCharCode(10));

/** 입금 안내 — 계좌, 금액, 입금자명, 승인 기준을 한 번에 보여줍니다. */
function PaymentBox({ ad, title }: { ad: Ad; title?: string }) {
  return (
    <div className="rounded-2xl border border-[#0e7a63]/30 bg-[#f1fbf7] p-5">
      <p className="text-[15px] font-extrabold text-[#0e7a63]">{title ?? "입금 안내"}</p>
      <dl className="mt-3 space-y-2 text-[14.5px]">
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">상품</dt><dd className="font-bold">{AD_KIND_LABEL[ad.kind]} · {AD_PLANS[ad.plan].label}</dd></div>
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">입금 금액</dt><dd className="font-black text-brand">{won(adPrice(ad))}</dd></div>
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">입금 계좌</dt><dd className="font-bold">{AD_BANK.bank} <span className="select-all tabular-nums">{AD_BANK.number}</span> ({AD_BANK.holder})</dd></div>
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">입금자명</dt><dd className="font-bold"><span className="select-all">{depositorName(ad.id)}</span> <span className="font-normal text-muted">(신청 번호가 붙은 이름으로 보내주세요)</span></dd></div>
      </dl>
      <ul className="mt-3 space-y-1 text-[13px] leading-relaxed text-muted">
        <li>· 입금이 확인되면 승인되고, <b className="text-ink-2">승인된 시점부터 {AD_PLANS[ad.plan].label}</b> 동안 노출돼요.</li>
        <li>· <b className="text-ink-2">승인(노출 시작) 이후에는 환불이 어려워요.</b> 승인 전 취소와 환불 기준은 <Link href="/policy#ads-refund" className="underline">운영정책</Link>에서 확인해주세요.</li>
        <li>· 확인은 운영자가 직접 하므로 시간이 걸릴 수 있어요. {AD_PAY_DAYS}일 안에 입금하지 않으면 신청이 취소될 수 있어요.</li>
      </ul>
    </div>
  );
}

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ requested?: string; error?: string }> }) {
  const { requested, error } = await searchParams;
  const user = await getCurrentUser();
  // 광고 테이블이 아직 준비되지 않은 환경에서도 페이지가 깨지지 않도록 실패하면 빈 값으로 대체합니다.
  const safe = async <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);
  const [liveAds, myAds, myPosts] = await Promise.all([
    safe(store.listAds({ liveOnly: true }), []),
    user ? safe(store.listAds({ requestedBy: user.id }), []) : Promise.resolve([]),
    user ? store.listPosts({ authorId: user.id, sort: "latest", pageSize: 100 }) : Promise.resolve({ items: [], total: 0 }),
  ]);
  const publicPosts = myPosts.items.filter((p) => isPostPublic(p));
  const premiumUsed = liveAds.filter((a) => a.kind === "premium").length;
  const bannerUsed = liveAds.filter((a) => a.kind === "banner").length;
  const email = contactEmail();
  const titleOf = (id: number) => myPosts.items.find((p) => p.id === id)?.title ?? `#${id}`;

  return (
    <div className="wrap max-w-[920px] py-7 sm:py-10">
      <header className="mb-7">
        <h1 className="text-[28px] font-black tracking-[-0.045em] sm:text-[34px]">광고 상품</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          홍보글 등록은 계속 무료예요. 더 많은 사람에게 보여주고 싶을 때만 선택하세요. 별도 이미지를 만들 필요 없이 이미 등록한 홍보글로 바로 신청할 수 있어요.
        </p>
      </header>

      {requested && (() => {
        const ad = myAds.find((a) => String(a.id) === requested && a.status === "requested");
        return ad ? (
          <div className="mb-6">
            <PaymentBox ad={ad} title="신청이 접수됐어요. 아래 계좌로 입금해주세요" />
          </div>
        ) : (
          <p role="status" className="mb-6 rounded-xl bg-[#e9f9f3] px-4 py-3 text-[14px] font-medium text-[#0e7a63]">
            신청이 접수됐어요. 아래 &quot;내 신청 내역&quot;에서 입금 안내를 확인해주세요.
          </p>
        );
      })()}
      {error && (
        <p role="alert" className="mb-6 rounded-xl bg-brand-soft px-4 py-3 text-[14px] font-medium text-brand-dark">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(["premium", "banner"] as const).map((kind) => (
          <section key={kind} className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.03em]">
              {kind === "premium" ? <Crown size={19} className="text-[#e0a100]" fill="currentColor" aria-hidden /> : <GalleryHorizontal size={19} className="text-brand" aria-hidden />}
              {AD_KIND_LABEL[kind]}
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
              {kind === "premium"
                ? `메인 최상단 "프리미엄 홍보" 영역에 ${AD_PREMIUM_SLOTS}칸 중 한 칸으로 고정돼요. 새로고침할 때마다 순서가 섞여 모두 공평하게 앞자리에 노출돼요.`
                : `메인 상단에 가로로 크게 보이는 배너예요. 동시에 최대 ${AD_BANNER_SLOTS}개가 번갈아 노출돼요. 배너는 내 홍보글의 대표 이미지·제목·소개로 자동 제작돼요.`}
            </p>
            <ul className="mt-3 space-y-1.5 text-[14.5px]">
              {(["week", "month"] as const).map((plan) => (
                <li key={plan} className="flex items-center justify-between rounded-lg bg-soft px-3 py-2">
                  <span className="font-medium text-ink-2">{AD_PLANS[plan].label}</span>
                  <b className="tabular-nums">{won(AD_PRICES[kind][plan])}</b>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-muted">
              현재 <b className="text-ink-2">{kind === "premium" ? `${premiumUsed}/${AD_PREMIUM_SLOTS}` : `${bannerUsed}/${AD_BANNER_SLOTS}`}</b> 사용 중
              {(kind === "premium" ? premiumUsed >= AD_PREMIUM_SLOTS : bannerUsed >= AD_BANNER_SLOTS) && " · 가득 차서 대기 신청만 가능해요"}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-7 rounded-2xl border border-[#f0b429]/50 bg-[#fffbee] p-5 sm:p-6" aria-label="구매 문의">
        <h2 className="text-[18px] font-extrabold tracking-[-0.03em]">구매·결제 문의는 이메일로</h2>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">
          아래에서 신청하시면 바로 입금 계좌가 안내돼요. 궁금한 점이나 결제 관련 문의는 이메일로 보내주세요.
        </p>
        {email ? (
          <a
            href={`mailto:${email}?subject=${encodeURIComponent("[더홍보 광고 문의]")}&body=${encodeURIComponent(MAIL_BODY)}`}
            className="btn btn-outline mt-3 inline-flex"
          >
            {email} 로 문의하기
          </a>
        ) : (
          <p className="mt-3 text-[13.5px] text-muted">문의 이메일을 준비하고 있어요. 아래 신청서를 남겨주시면 가입 계정으로 안내드릴게요.</p>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6" aria-label="광고 신청">
        <h2 className="text-[18px] font-extrabold tracking-[-0.03em]">신청하기</h2>
        {!user ? (
          <p className="mt-3 text-[14.5px] text-muted">
            광고는 내가 쓴 홍보글로 신청해요.{" "}
            <Link href="/auth?next=%2Fadvertise" className="font-bold text-brand underline">
              로그인
            </Link>
            한 뒤 신청해주세요.
          </p>
        ) : publicPosts.length === 0 ? (
          <p className="mt-3 text-[14.5px] text-muted">
            공개 중인 홍보글이 없어요. 먼저{" "}
            <Link href="/write" className="font-bold text-brand underline">
              홍보글을 등록
            </Link>
            해주세요.
          </p>
        ) : (
          <AdRequestForm posts={publicPosts} action={requestAdAction} />
        )}
      </section>

      {myAds.length > 0 && (
        <section className="mt-7" aria-label="내 신청 내역">
          <h2 className="mb-2 text-[16px] font-extrabold tracking-[-0.03em]">내 신청 내역</h2>
          <ul className="space-y-2">
            {myAds.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[14px]">
                <span className="min-w-0 flex-1 truncate font-bold">{titleOf(a.postId)}</span>
                <span className="text-muted">
                  {AD_KIND_LABEL[a.kind]} · {AD_PLANS[a.plan].label}
                </span>
                <span className={a.status === "active" ? "font-bold text-[#0e7a63]" : "font-bold text-[#9a6b00]"}>
                  {a.status === "active" && a.endsAt ? `${formatDate(a.endsAt)}까지 노출` : "입금 확인 대기"}
                </span>
                {a.status === "requested" && (
                  <div className="basis-full pt-1">
                    <PaymentBox ad={a} title={`입금 안내 · ${titleOf(a.postId)}`} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
