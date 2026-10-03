import { adminDeleteBanner, adminSaveBanner } from "../actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PromoBanner } from "@/components/PromoBanner";
import { store } from "@/lib/store";
import type { Banner } from "@/lib/types";

const THEMES: Array<[Banner["theme"], string]> = [
  ["coral", "코랄"],
  ["blue", "블루"],
  ["mint", "민트"],
  ["violet", "바이올렛"],
  ["amber", "앰버"],
];

function BannerForm({ b }: { b?: Banner }) {
  return (
    <form action={adminSaveBanner} className="grid gap-3 sm:grid-cols-2">
      {b && <input type="hidden" name="id" value={b.id} />}
      <label className="text-xs font-semibold text-muted">
        제목
        <input name="title" required maxLength={60} defaultValue={b?.title} className="field mt-1 !py-2" />
      </label>
      <label className="text-xs font-semibold text-muted">
        보조 문구
        <input name="subtitle" maxLength={80} defaultValue={b?.subtitle ?? ""} className="field mt-1 !py-2" />
      </label>
      <label className="text-xs font-semibold text-muted">
        이동 주소 (사이트 내부는 /로 시작, 외부는 https://)
        <input name="targetUrl" required defaultValue={b?.targetUrl} placeholder="/write" className="field mt-1 !py-2" />
      </label>
      <label className="text-xs font-semibold text-muted">
        배경 이미지 주소 (선택)
        <input name="imageUrl" defaultValue={b?.imageUrl ?? ""} placeholder="비워두면 색상 배너로 표시" className="field mt-1 !py-2" />
      </label>
      <div className="grid grid-cols-3 gap-3 sm:col-span-2">
        <label className="text-xs font-semibold text-muted">
          위치
          <select name="placement" defaultValue={b?.placement ?? "strip"} className="field mt-1 !py-2">
            <option value="side">우측 사이드</option>
            <option value="strip">본문 중간 띠</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">
          색상
          <select name="theme" defaultValue={b?.theme ?? "coral"} className="field mt-1 !py-2">
            {THEMES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">
          순서
          <input name="sortOrder" type="number" defaultValue={b?.sortOrder ?? 0} className="field mt-1 !py-2" />
        </label>
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <label className="flex items-center gap-1.5 text-sm font-medium text-ink-2">
          <input type="checkbox" name="isActive" defaultChecked={b ? b.isActive : true} className="accent-[#f04f4a]" /> 노출
        </label>
        <button className="btn btn-primary btn-sm">{b ? "저장" : "배너 추가"}</button>
      </div>
    </form>
  );
}

export default async function AdminBanners() {
  const banners = await store.listBanners();
  return (
    <div className="space-y-4">
      <p className="text-[14px] text-muted">
        <b className="text-ink-2">우측 사이드</b> 배너는 순서대로 앞 2개가, <b className="text-ink-2">본문 중간 띠</b> 배너는 앞 3개가 메인에 노출돼요.
      </p>
      {banners.map((b) => (
        <section key={b.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="mb-3 grid gap-3 md:grid-cols-[280px_1fr]">
            <div>
              <PromoBanner banner={b} />
              {!b.isActive && <p className="mt-1 text-xs font-semibold text-faint">현재 숨김 상태</p>}
            </div>
            <BannerForm b={b} />
          </div>
          <form action={adminDeleteBanner} className="text-right">
            <input type="hidden" name="id" value={b.id} />
            <ConfirmButton message="이 배너를 삭제할까요?">배너 삭제</ConfirmButton>
          </form>
        </section>
      ))}
      <section className="rounded-2xl border border-dashed border-[#c9ced9] bg-soft/50 p-4">
        <h2 className="mb-3 font-extrabold">새 배너 추가</h2>
        <BannerForm />
      </section>
    </div>
  );
}
