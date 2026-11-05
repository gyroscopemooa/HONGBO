import Link from "next/link";
import { adminApproveAd, adminAssignAd, adminDeleteAd } from "../actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AD_BANNER_SLOTS, AD_KIND_LABEL, AD_PLANS, AD_PREMIUM_SLOTS, AD_PRICES, depositorName, isAdLive, won } from "@/lib/ads";
import { store } from "@/lib/store";
import type { Ad } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function withPost(ads: Ad[]) {
  return Promise.all(ads.map(async (a) => ({ ad: a, post: await store.getPost(a.postId) })));
}

function Row({ ad, title, children }: { ad: Ad; title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-white p-3.5">
      <div className="min-w-0 flex-1">
        <Link href={`/post/${ad.postId}`} className="line-clamp-1 font-bold hover:text-brand">
          #{ad.postId} {title}
        </Link>
        <p className="mt-0.5 text-[13px] text-muted">
          {AD_KIND_LABEL[ad.kind]} · {AD_PLANS[ad.plan].label} ({won(AD_PRICES[ad.kind][ad.plan])})
          {ad.status === "requested" && <> · 입금자명 <b className="text-ink-2">{depositorName(ad.id)}</b></>}
          {ad.slotNo != null && <> · {ad.slotNo}번 칸</>}
          {ad.endsAt && <> · {formatDate(ad.endsAt)}까지</>}
        </p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </li>
  );
}

export default async function AdminAds({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const all = await store.listAds();
  const requested = await withPost(all.filter((a) => a.status === "requested"));
  const live = await withPost(all.filter((a) => isAdLive(a)));
  const ended = await withPost(all.filter((a) => a.status === "active" && !isAdLive(a)));
  const premiumLive = live.filter((x) => x.ad.kind === "premium").length;
  const bannerLive = live.filter((x) => x.ad.kind === "banner").length;

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-xl bg-brand-soft px-4 py-3 text-[14px] font-medium text-brand-dark">
          {error}
        </p>
      )}
      <p className="text-[14px] text-muted">
        프리미엄 <b className="text-ink-2">{premiumLive}/{AD_PREMIUM_SLOTS}</b>칸 · 와이드 배너 <b className="text-ink-2">{bannerLive}/{AD_BANNER_SLOTS}</b>자리 사용 중. 입금을 확인한 뒤 <b className="text-ink-2">승인</b>하면 그 시점부터 기간이 시작돼요.
      </p>

      <section aria-label="승인 대기">
        <h2 className="mb-2 font-extrabold">입금 확인·승인 대기 ({requested.length})</h2>
        {requested.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-faint">대기 중인 신청이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {requested.map(({ ad, post }) => (
              <Row key={ad.id} ad={ad} title={post?.title ?? "(삭제된 글)"}>
                <form action={adminApproveAd}>
                  <input type="hidden" name="id" value={ad.id} />
                  <button className="btn btn-primary btn-sm">승인</button>
                </form>
                <form action={adminDeleteAd}>
                  <input type="hidden" name="id" value={ad.id} />
                  <ConfirmButton message="이 신청을 거절(삭제)할까요?">거절</ConfirmButton>
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
            {live.map(({ ad, post }) => (
              <Row key={ad.id} ad={ad} title={post?.title ?? "(삭제된 글)"}>
                <form action={adminDeleteAd}>
                  <input type="hidden" name="id" value={ad.id} />
                  <ConfirmButton message="노출을 중단하고 삭제할까요?">중단</ConfirmButton>
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
            {ended.map(({ ad, post }) => (
              <Row key={ad.id} ad={ad} title={post?.title ?? "(삭제된 글)"}>
                <form action={adminDeleteAd}>
                  <input type="hidden" name="id" value={ad.id} />
                  <ConfirmButton message="기록을 삭제할까요?">삭제</ConfirmButton>
                </form>
              </Row>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-[#c9ced9] bg-soft/50 p-4" aria-label="직접 지정">
        <h2 className="mb-1 font-extrabold">글 번호로 바로 지정</h2>
        <p className="mb-3 text-[13px] text-muted">제휴·테스트용입니다. 신청 없이 바로 승인되어 지금부터 노출돼요.</p>
        <form action={adminAssignAd} className="grid gap-3 sm:grid-cols-4">
          <label className="text-xs font-semibold text-muted">
            글 번호
            <input name="postId" type="number" min={1} required className="field mt-1 !py-2" />
          </label>
          <label className="text-xs font-semibold text-muted">
            상품
            <select name="kind" className="field mt-1 !py-2">
              <option value="premium">{AD_KIND_LABEL.premium}</option>
              <option value="banner">{AD_KIND_LABEL.banner}</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-muted">
            기간
            <select name="plan" className="field mt-1 !py-2">
              <option value="week">{AD_PLANS.week.label}</option>
              <option value="month">{AD_PLANS.month.label}</option>
            </select>
          </label>
          <div className="flex items-end">
            <button className="btn btn-primary btn-sm w-full">지정하기</button>
          </div>
        </form>
      </section>
    </div>
  );
}
