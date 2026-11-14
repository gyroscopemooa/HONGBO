import { won } from "@/lib/ads";
import { HERO_TOTAL_SLOTS, heroCustomerCapacity } from "@/lib/hero-capacity";
import { infl09SlideEnabled } from "@/lib/infl09";
import { ConfirmButton } from "@/components/ConfirmButton";
import { HeroAdPreview } from "@/components/HeroAdSlide";
import { listHeroAds } from "@/lib/hero-ad-store";
import { HERO_PLANS, heroPrice, isHeroLive, type HeroAd } from "@/lib/hero-ads";
import { formatDate } from "@/lib/utils";
import { adminApproveHeroAd, adminDeleteHeroAd, adminSetHeroAdLink } from "./actions";

export const dynamic = "force-dynamic";

const DESIGN_LABEL = { template: "템플릿", image: "직접 만든 이미지", discuss: "협의 후 제작" } as const;

function Row({ ad, children }: { ad: HeroAd; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-white p-3.5">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-bold">#{ad.id} {ad.title || ad.advertiser || "(제목 없음)"}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {HERO_PLANS[ad.plan].label} ({ad.freeTrial ? "무료 체험 7일" : won(heroPrice(ad.plan))}) · {DESIGN_LABEL[ad.designMode]} · 링크 {ad.linkMode === "url" ? ad.linkUrl : "협의 후 결정"}
          {ad.status === "requested" && <> · {ad.freeTrial ? "입금 불필요 · 연장 불가" : "입금 확인 필요"}</>}
          {ad.endsAt && <> · {formatDate(ad.endsAt)}까지</>}
          {ad.advertiser && <> · 광고주 {ad.advertiser}</>}
        </p>
        {ad.memo && <p className="mt-1 whitespace-pre-line text-[13px] text-ink-2">메모: {ad.memo}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {ad.designMode !== "discuss" && (
        <div className="max-w-[720px] basis-full">
          <HeroAdPreview ad={ad} />
        </div>
      )}
    </li>
  );
}

export default async function AdminHeroAds({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const capacity = heroCustomerCapacity(infl09SlideEnabled());
  const all = await listHeroAds().catch(() => null);
  if (!all) {
    return <p className="rounded-xl bg-brand-soft px-4 py-3 text-[14px] font-medium text-brand-dark">슬라이드 광고 테이블이 아직 없어요. supabase/migrations/0010_hero_ads.sql 을 먼저 실행해주세요.</p>;
  }
  const requested = all.filter((a) => a.status === "requested");
  const live = all.filter((a) => isHeroLive(a));
  const ended = all.filter((a) => a.status === "active" && !isHeroLive(a));
  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-xl bg-brand-soft px-4 py-3 text-[14px] font-medium text-brand-dark">{error}</p>}
      <p className="text-[14px] text-muted">
        홈 큰 슬라이드 광고 <b className="text-ink-2">{live.length}/{capacity}</b>자리 사용 중. 기본 안내와 인플공구 광고를 합쳐 최대 {HERO_TOTAL_SLOTS}개이며, 인플공구 노출 시 1자리를 사용합니다. 광고가 늘면 기본 안내가 줄고 종료되면 복원돼요. 신청 검토(유료는 입금 확인 및 협의)가 끝나면 <b className="text-ink-2">승인</b>해 주세요. 승인한 시점부터 기간이 시작돼요. 이미지·문구·링크를 꼭 확인하세요.
      </p>

      <section aria-label="승인 대기">
        <h2 className="mb-2 font-extrabold">신청·승인 대기 ({requested.length})</h2>
        {requested.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-faint">대기 중인 신청이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {requested.map((ad) => (
              <Row key={ad.id} ad={ad}>
                <form action={adminApproveHeroAd} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={ad.id} />
                  {ad.linkMode === "discuss" && <input name="linkUrl" placeholder="협의한 링크(선택)" aria-label="협의한 링크" className="field !w-48 !py-1.5 text-[13px]" />}
                  <button className="btn btn-primary btn-sm">승인</button>
                </form>
                <form action={adminDeleteHeroAd}>
                  <input type="hidden" name="id" value={ad.id} />
                  <ConfirmButton message="이 신청을 거절할까요? 무료 체험 이력은 재신청 방지를 위해 보관됩니다.">거절</ConfirmButton>
                </form>
              </Row>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="노출 중">
        <h2 className="mb-2 font-extrabold">노출 중 ({live.length})</h2>
        {live.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-faint">노출 중인 광고가 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {live.map((ad) => (
              <Row key={ad.id} ad={ad}>
                <form action={adminSetHeroAdLink} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={ad.id} />
                  <input name="linkUrl" placeholder="링크 넣기·바꾸기" aria-label="링크" className="field !w-44 !py-1.5 text-[13px]" />
                  <button className="btn btn-outline btn-sm">저장</button>
                </form>
                <form action={adminDeleteHeroAd}>
                  <input type="hidden" name="id" value={ad.id} />
                  <ConfirmButton message="노출을 중단할까요? 무료 체험 이력은 보관됩니다.">중단</ConfirmButton>
                </form>
              </Row>
            ))}
          </ul>
        )}
      </section>

      {ended.length > 0 && (
        <section aria-label="종료">
          <h2 className="mb-2 font-extrabold">기간 종료 ({ended.length})</h2>
          <ul className="space-y-2">
            {ended.map((ad) => (
              <Row key={ad.id} ad={ad}>
                <form action={adminDeleteHeroAd}>
                  <input type="hidden" name="id" value={ad.id} />
                  <ConfirmButton message="기록을 삭제할까요?">삭제</ConfirmButton>
                </form>
              </Row>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
