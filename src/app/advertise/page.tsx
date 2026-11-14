import { freeAdTrialEnabled } from "@/lib/free-ad-trial";
import type { Ad } from "@/lib/types";
import { HERO_TOTAL_SLOTS, heroCustomerCapacity } from "@/lib/hero-capacity";
import { infl09SlideEnabled } from "@/lib/infl09";
import type { Metadata } from "next";
import Link from "next/link";
import { Crown, GalleryHorizontal, Presentation } from "lucide-react";
import { requestAdAction } from "@/app/actions/ads";
import { AdRequestForm } from "@/components/AdRequestForm";
import { HeroAdRequestForm } from "@/components/HeroAdRequestForm";
import { requestHeroAdAction } from "@/app/actions/hero-ads";
import { HERO_PLANS, heroDepositor, heroPrice, isHeroLive, type HeroAd } from "@/lib/hero-ads";
import { listHeroAds } from "@/lib/hero-ad-store";
import { AD_BANK, AD_PAY_DAYS, adPrice, depositorName, won, AD_BANNER_SLOTS, AD_KIND_LABEL, AD_PLANS, AD_PREMIUM_SLOTS } from "@/lib/ads";
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

const MAIL_BODY = ["광고할 홍보글 주소:", "희망 상품(프리미엄/배너):", "무료 체험 기간: 승인 후 7일", "희망 시작일:", ""].join(String.fromCharCode(10));

/** 한시 무료 모집 중에는 입금 정보를 노출하지 않습니다. 승인 절차는 유지합니다. */
function FreeRequestNotice() {
  return <div className="rounded-xl bg-[#f1fbf7] p-4 text-[14px] leading-relaxed text-[#0e7a63]">무료 신청이 접수됐어요. 입금은 필요하지 않으며, 운영자 검토·승인 후 7일 동안 노출돼요. 무료 기간 연장은 불가하며 이후 노출은 유료 광고로 문의해주세요.</div>;
}

/** 입금 안내 — 계좌, 금액, 입금자명, 승인 기준을 한 번에 보여줍니다. */
function PaymentBox({ ad, title }: { ad: Ad; title?: string }) {
  if (ad.freeTrial) return <FreeRequestNotice />;
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

function HeroPaymentBox({ ad, title }: { ad: HeroAd; title?: string }) {
  if (ad.freeTrial) return <FreeRequestNotice />;
  return (
    <div className="rounded-2xl border border-[#0e7a63]/30 bg-[#f1fbf7] p-5">
      <p className="text-[15px] font-extrabold text-[#0e7a63]">{title ?? "입금 안내"}</p>
      <dl className="mt-3 space-y-2 text-[14.5px]">
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">상품</dt><dd className="font-bold">홈 슬라이드 광고 · {HERO_PLANS[ad.plan].label}</dd></div>
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">입금 금액</dt><dd className="font-black text-brand">{won(heroPrice(ad.plan))}</dd></div>
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">입금 계좌</dt><dd className="font-bold">{AD_BANK.bank} <span className="select-all tabular-nums">{AD_BANK.number}</span> ({AD_BANK.holder})</dd></div>
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">입금자명</dt><dd className="font-bold"><span className="select-all">{heroDepositor(ad.id)}</span> <span className="font-normal text-muted">(신청 번호가 붙은 이름으로 보내주세요)</span></dd></div>
      </dl>
      <ul className="mt-3 space-y-1 text-[13px] leading-relaxed text-muted">
        <li>· 입금이 확인되면 승인되고, <b className="text-ink-2">승인된 시점부터 {HERO_PLANS[ad.plan].label}</b> 동안 노출돼요.</li>
        {(ad.designMode === "discuss" || ad.linkMode === "discuss") && <li>· 제작·링크를 <b className="text-ink-2">협의하기로 한 신청</b>은 입금 확인 후 가입 이메일로 연락드려요. 협의가 끝나면 승인돼요.</li>}
        <li>· <b className="text-ink-2">승인(노출 시작) 이후에는 환불이 어려워요.</b> 기준은 <Link href="/policy#ads-refund" className="underline">운영정책</Link>에서 확인해주세요. {AD_PAY_DAYS}일 안에 입금하지 않으면 신청이 취소될 수 있어요.</li>
      </ul>
    </div>
  );
}


export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ requested?: string; heroRequested?: string; error?: string; type?: string }> }) {
  const { requested, heroRequested, error, type } = await searchParams;
  const freeTrial = freeAdTrialEnabled();
  const capacity = heroCustomerCapacity(infl09SlideEnabled());
  const selected = type === "banner" || type === "premium" ? type : "hero";
  const user = await getCurrentUser();
  // 광고 테이블이 아직 준비되지 않은 환경에서도 페이지가 깨지지 않도록 실패하면 빈 값으로 대체합니다.
  const safe = async <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);
  const [liveAds, myAds, myPosts, liveHero, myHero] = await Promise.all([
    safe(store.listAds({ liveOnly: true }), []),
    user ? safe(store.listAds({ requestedBy: user.id }), []) : Promise.resolve([]),
    user ? store.listPosts({ authorId: user.id, sort: "latest", pageSize: 100 }) : Promise.resolve({ items: [], total: 0 }),
    safe(listHeroAds({ liveOnly: true }), []),
    user ? safe(listHeroAds({ requestedBy: user.id }), []) : Promise.resolve([] as HeroAd[]),
  ]);
  const publicPosts = myPosts.items.filter((p) => isPostPublic(p));
  const premiumUsed = liveAds.filter((a) => a.kind === "premium").length;
  const bannerUsed = liveAds.filter((a) => a.kind === "banner").length;
  const email = contactEmail();
  const titleOf = (id: number) => myPosts.items.find((p) => p.id === id)?.title ?? `#${id}`;

  return (
    <div className="wrap max-w-[920px] py-7 sm:py-10">
      <header className="mb-7">
        <h1 className="text-[28px] font-black tracking-[-0.045em] sm:text-[34px]">{freeTrial ? "광고 무료 체험 신청" : "광고 신청"}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {freeTrial ? "한시 무료 체험: 계정당 1회 · 게시물 1개 · 승인 후 7일. 무료 기간 연장과 같은 게시물 재신청은 불가하며, 이후 노출은 유료 광고로 문의해주세요. 자동 결제는 없어요." : "원하는 광고 유형을 선택하면 해당 설명과 요금·신청서가 나와요. 신청 후 입금 확인과 관리자 승인을 거쳐 노출돼요."}
        </p>
      </header>

      {requested && (() => {
        const ad = myAds.find((a) => String(a.id) === requested && a.status === "requested");
        return ad ? (
          <div className="mb-6">
            <PaymentBox ad={ad} />
          </div>
        ) : (
          <p role="status" className="mb-6 rounded-xl bg-[#e9f9f3] px-4 py-3 text-[14px] font-medium text-[#0e7a63]">
            신청이 접수됐어요. 아래 &quot;내 신청 내역&quot;에서 승인 상태를 확인해주세요.
          </p>
        );
      })()}
      {error && (
        <p role="alert" className="mb-6 rounded-xl bg-brand-soft px-4 py-3 text-[14px] font-medium text-brand-dark">
          {error}
        </p>
      )}

      <nav className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="광고 유형 선택">
        {([
          { id: "hero", label: "홈 슬라이드", icon: Presentation, desc: "큰 화면에 순환 노출" },
          { id: "banner", label: "와이드 배너", icon: GalleryHorizontal, desc: "가로형 배너 노출" },
          { id: "premium", label: "상단 고정", icon: Crown, desc: "프리미엄 카드 고정" },
        ] as const).map(({ id, label, icon: Icon, desc }) => (
          <Link key={id} href={`/advertise?type=${id}#ad-application`} aria-current={selected === id ? "true" : undefined}
            className={`min-w-0 rounded-xl border p-3 text-center transition sm:p-5 ${selected === id ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-line bg-white hover:border-brand"}`}>
            <Icon className="mx-auto mb-2 text-brand" size={23} aria-hidden />
            <span className="block text-[13px] font-extrabold sm:text-[17px]">{label}</span>
            <span className="mt-1 hidden text-[13px] text-muted sm:block">{desc}</span>
            <span className="mt-2 block text-[12px] font-bold text-brand">{freeTrial ? "무료 체험 신청" : "요금·신청 보기"}</span>
          </Link>
        ))}
      </nav>
      <div id="ad-application" className="scroll-mt-32">
      {selected === "hero" && (
      <section id="hero-ad" className="mt-4 scroll-mt-20 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6" aria-label="홈 슬라이드 광고">
        <h2 className="flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.03em]">
          <Presentation size={19} className="text-brand" aria-hidden />
          홈 슬라이드 광고
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[12px] font-bold text-brand-dark">NEW</span>
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          메인 화면 중간의 큰 슬라이드에 내 광고가 들어가요. 내가 등록한 홍보글 1개로 신청할 수 있고, 지금 슬라이드처럼 <b className="text-ink-2">템플릿으로 만들거나</b>, <b className="text-ink-2">직접 만든 이미지</b>를 올리거나, <b className="text-ink-2">협의해서</b> 만들 수 있어요. 링크도 바로 연결하거나 협의 후 정할 수 있어요. 사용자 광고는 최대 {capacity}개이며, 인플공구·기본 안내를 포함해 전체 최대 {HERO_TOTAL_SLOTS}개가 번갈아 노출돼요.
        </p>
        <p className="mt-3 text-[13px] text-muted">현재 <b>{liveHero.length}/{capacity}</b> 사용 중 · {freeTrial ? "계정당 1회 · 게시물 1개 · 7일 무료 체험" : "선택한 유료 기간 동안 노출"} · 운영자 승인 후 시작</p>
        {heroRequested && (() => {
          const ad = myHero.find((a) => String(a.id) === heroRequested && a.status === "requested");
          return ad ? (
            <div className="mt-4"><HeroPaymentBox ad={ad} /></div>
          ) : (
            <p role="status" className="mt-4 rounded-xl bg-[#e9f9f3] px-4 py-3 text-[14px] font-medium text-[#0e7a63]">신청이 접수됐어요. 아래 &quot;내 슬라이드 광고&quot;에서 승인 상태를 확인해주세요.</p>
          );
        })()}
        {!user ? (
          <p className="mt-4 text-[14.5px] text-muted">
            <Link href={`/auth?next=${encodeURIComponent(`/advertise?type=${selected}#ad-application`)}`} className="font-bold text-brand underline">로그인</Link>한 뒤 신청해주세요.
          </p>
        ) : (
          (!freeTrial || publicPosts.length) ? <HeroAdRequestForm freeTrial={freeTrial} posts={publicPosts} action={requestHeroAdAction} /> : <p className="mt-4">먼저 <Link href="/write" className="text-brand underline">홍보글을 등록</Link>해주세요.</p>
        )}
        {myHero.length > 0 && (
          <div className="mt-6" aria-label="내 슬라이드 광고">
            <h3 className="mb-2 text-[15px] font-extrabold">내 슬라이드 광고</h3>
            <ul className="space-y-2">
              {myHero.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-4 py-3 text-[14px]">
                  <span className="min-w-0 flex-1 truncate font-bold">{a.title || a.advertiser || `신청 #${a.id}`}</span>
                  <span className="text-muted">{HERO_PLANS[a.plan].label}</span>
                  <span className={a.status === "active" ? "font-bold text-[#0e7a63]" : "font-bold text-[#9a6b00]"}>
                    {a.status === "active" && a.endsAt ? (isHeroLive(a) ? `${formatDate(a.endsAt)}까지 노출` : "기간 종료") : "검토·승인 대기"}
                  </span>
                  {a.status === "requested" && <div className="basis-full pt-1"><HeroPaymentBox ad={a} /></div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      )}

      {selected !== "hero" && (
      <section className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6" aria-label="광고 신청">
        <h2 className="text-[18px] font-extrabold tracking-[-0.03em]">{AD_KIND_LABEL[selected]} {freeTrial ? "무료 체험 신청" : "신청"}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{selected === "premium" ? `메인 최상단 프리미엄 영역에 고정돼요. 현재 ${premiumUsed}/${AD_PREMIUM_SLOTS}칸 사용 중이에요.` : `홍보글의 사진과 문구로 만든 가로 배너가 번갈아 노출돼요. 현재 ${bannerUsed}/${AD_BANNER_SLOTS}자리 사용 중이에요.`} {freeTrial ? "검토·승인 후 7일 무료 체험이에요." : "입금 확인·승인 후 선택한 기간 동안 노출돼요."}</p>
        {!user ? (
          <p className="mt-3 text-[14.5px] text-muted">
            광고는 내가 쓴 홍보글로 신청해요.{" "}
            <Link href={`/auth?next=${encodeURIComponent(`/advertise?type=${selected}#ad-application`)}`} className="font-bold text-brand underline">
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
          <AdRequestForm freeTrial={freeTrial} key={selected} initialKind={selected} posts={publicPosts} action={requestAdAction} />
        )}
      </section>

      )}
      </div>

      <section className="mt-7 rounded-2xl border border-[#f0b429]/50 bg-[#fffbee] p-5 sm:p-6" aria-label="구매 문의">
        <h2 className="text-[18px] font-extrabold tracking-[-0.03em]">광고 문의</h2>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">
          무료 체험 이후 유료 광고 이용 가능 여부와 요금, 광고 제작·노출 관련 사항은 이메일로 문의해주세요.
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
                  {a.status === "active" && a.endsAt ? `${formatDate(a.endsAt)}까지 노출` : "검토·승인 대기"}
                </span>
                {a.status === "requested" && (
                  <div className="basis-full pt-1">
                    <PaymentBox ad={a} />
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
