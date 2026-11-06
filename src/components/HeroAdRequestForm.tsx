"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { won } from "@/lib/ads";
import { HERO_DESIGN_FEE, HERO_LIMITS, HERO_PLANS, HERO_PRICES, HERO_THEMES, type HeroDesignMode, type HeroLinkMode, type HeroPlan, type HeroTheme } from "@/lib/hero-ads";
import type { ProcessOptions } from "@/lib/image-client";
import { cn } from "@/lib/utils";
import { ImagePicker } from "./AdRequestForm";
import { HeroAdPreview } from "./HeroAdSlide";

/** 홈 슬라이드는 가로로 아주 긴 3:1 비율 (2172×724) */
const HERO_IMG: ProcessOptions = { ratio: 2172 / 724, maxWidth: 2172 };

const card = "flex cursor-pointer items-start gap-2 rounded-xl border border-line px-3.5 py-3 text-[14.5px] has-[:checked]:border-brand has-[:checked]:bg-brand-soft";
const field = "field w-full";

const DESIGNS: Array<{ value: HeroDesignMode; title: string; desc: string }> = [
  { value: "template", title: "템플릿으로 만들기", desc: "제목·소개 문구와 색만 고르면 지금 보이는 슬라이드처럼 만들어 드려요." },
  { value: "image", title: "내 이미지 올리기", desc: "직접 만든 배너 이미지를 그대로 올려요. (가로로 긴 3:1)" },
  { value: "discuss", title: "협의 후 제작", desc: `원하는 분위기를 알려주시면 운영자가 연락해 함께 정해요. 제작 대행은 ${won(HERO_DESIGN_FEE)}부터 협의해요.` },
];

export function HeroAdRequestForm({ action }: { action: (fd: FormData) => void | Promise<void> }) {
  const [plan, setPlan] = useState<HeroPlan>("week");
  const [design, setDesign] = useState<HeroDesignMode>("template");
  const [link, setLink] = useState<HeroLinkMode>("url");
  const [theme, setTheme] = useState<HeroTheme>("violet");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [button, setButton] = useState("");
  const [image, setImage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const missingImage = design === "image" && !image;
  const previewAd = { id: 0, designMode: design, title: title || "광고 제목이 여기에 들어가요", subtitle: subtitle || null, buttonText: button || null, theme, imageUrl: image || null, linkMode: link, linkUrl: linkUrl || null };

  return (
    <form action={action} className="mt-4 space-y-5">
      <fieldset>
        <legend className="mb-1.5 text-[14px] font-bold text-ink-2">배너 만드는 방법</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {DESIGNS.map((d) => (
            <label key={d.value} className={card}>
              <input type="radio" name="designMode" value={d.value} checked={design === d.value} onChange={() => setDesign(d.value)} className="mt-1 accent-[#f04f4a]" />
              <span>
                <b className="block">{d.title}</b>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{d.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {design === "template" && (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[13.5px] font-bold text-ink-2">제목 <span className="font-normal text-muted">(최대 {HERO_LIMITS.title}자)</span></span>
            <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={HERO_LIMITS.title} className={field} placeholder="예) 우리 가게 오픈 이벤트" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13.5px] font-bold text-ink-2">소개 문구 <span className="font-normal text-muted">(선택, 최대 {HERO_LIMITS.subtitle}자)</span></span>
            <input name="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={HERO_LIMITS.subtitle} className={field} placeholder="예) 신규 가입 첫 달 무료, 지금 바로 확인해보세요" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13.5px] font-bold text-ink-2">버튼 문구 <span className="font-normal text-muted">(선택, 최대 {HERO_LIMITS.button}자 · 링크가 있을 때만 보여요)</span></span>
            <input name="buttonText" value={button} onChange={(e) => setButton(e.target.value)} maxLength={HERO_LIMITS.button} className={field} placeholder="자세히 보기" />
          </label>
          <fieldset>
            <legend className="mb-1.5 text-[13.5px] font-bold text-ink-2">색상</legend>
            <div className="flex flex-wrap gap-2">
              {HERO_THEMES.map((t) => (
                <label key={t.value} className={cn(card, "items-center bg-white py-2 text-[13.5px]")}>
                  <input type="radio" name="theme" value={t.value} checked={theme === t.value} onChange={() => setTheme(t.value)} className="accent-[#f04f4a]" />
                  <span className="size-4 rounded-full border border-line" style={{ background: t.bg }} aria-hidden />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {design === "image" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-white p-3.5 text-[13px] leading-relaxed text-ink-2">
            <p className="font-bold">이미지 규격</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted">
              <li>권장 크기 <b className="text-ink-2">2172 × 724px</b> (가로:세로 = 3:1) · JPG · PNG · WebP</li>
              <li>비율이 다르면 가운데를 기준으로 잘리고, 모바일에서는 양쪽 끝이 조금 더 잘려 보여요. 글자·로고는 가운데 70% 안쪽에 넣어주세요</li>
              <li>왼쪽 위에 &quot;광고&quot; 표시가 붙어요. 그 자리에는 중요한 내용을 넣지 마세요</li>
              <li>이미지는 운영자가 확인한 뒤 승인돼요</li>
            </ul>
          </div>
          <input type="hidden" name="imageUrl" value={image} />
          <ImagePicker value={image} onChange={setImage} opts={HERO_IMG} hint="이미지를 고르면 아래 미리보기에서 바로 확인할 수 있어요." />
        </div>
      )}

      {design === "discuss" && (
        <label className="block">
          <span className="mb-1 block text-[13.5px] font-bold text-ink-2">협의할 내용 <span className="font-normal text-muted">(최대 {HERO_LIMITS.memo}자)</span></span>
          <textarea name="memo" required rows={4} maxLength={HERO_LIMITS.memo} className={field} placeholder="어떤 광고인지, 원하는 분위기·문구, 참고할 자료나 사이트를 적어주세요. 입금 확인 뒤 가입 이메일로 연락드려요." />
        </label>
      )}

      <div>
        <p className="mb-1.5 text-[13.5px] font-bold text-ink-2">{design === "discuss" ? "예시 화면 (실제 모양은 협의 후 정해져요)" : "홈 화면에서 이렇게 보여요"}</p>
        {missingImage ? (
          <p className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-[13.5px] text-muted">이미지를 올리면 여기에 미리 보여요.</p>
        ) : (
          <HeroAdPreview ad={design === "discuss" ? { ...previewAd, designMode: "template", title: "여기에 광고가 들어가요", subtitle: "문구와 디자인은 협의 후 정해요" } : previewAd} />
        )}
      </div>

      <fieldset>
        <legend className="mb-1.5 text-[14px] font-bold text-ink-2">클릭하면 어디로 갈까요?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={card}>
            <input type="radio" name="linkMode" value="url" checked={link === "url"} onChange={() => setLink("url")} className="mt-1 accent-[#f04f4a]" />
            <span><b className="block">링크 연결</b><span className="text-[12.5px] text-muted">내 사이트·더홍보 글·SNS 주소로 연결해요.</span></span>
          </label>
          <label className={card}>
            <input type="radio" name="linkMode" value="discuss" checked={link === "discuss"} onChange={() => setLink("discuss")} className="mt-1 accent-[#f04f4a]" />
            <span><b className="block">협의 후 결정</b><span className="text-[12.5px] text-muted">지금은 정하지 않고, 운영자와 상의해서 연결해요. (그전에는 클릭되지 않아요)</span></span>
          </label>
        </div>
        {link === "url" && (
          <input name="linkUrl" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} required inputMode="url" className={cn(field, "mt-2")} placeholder="https://example.com" />
        )}
      </fieldset>

      <label className="block">
        <span className="mb-1 block text-[13.5px] font-bold text-ink-2">광고주 이름 <span className="font-normal text-muted">(선택, 운영자 확인용)</span></span>
        <input name="advertiser" maxLength={HERO_LIMITS.advertiser} className={field} placeholder="업체·서비스 이름" />
      </label>
      {design !== "discuss" && (
        <label className="block">
          <span className="mb-1 block text-[13.5px] font-bold text-ink-2">운영자에게 전할 말 <span className="font-normal text-muted">(선택)</span></span>
          <textarea name="memo" rows={2} maxLength={HERO_LIMITS.memo} className={field} placeholder="희망 시작일 등 전할 내용이 있으면 적어주세요." />
        </label>
      )}

      <fieldset>
        <legend className="mb-1.5 text-[14px] font-bold text-ink-2">기간</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["week", "month"] as const).map((p) => (
            <label key={p} className={cn(card, "items-center")}>
              <input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} className="accent-[#f04f4a]" />
              {HERO_PLANS[p].label}
              <span className="ml-auto text-[12.5px] text-muted">{won(HERO_PRICES[p])}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <ul className="space-y-1 text-[13px] text-muted">
        <li className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden /> 신청하면 바로 입금 계좌가 안내돼요. 입금이 확인되어 승인된 시점부터 기간이 시작돼요.</li>
        <li className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden /> 슬라이드에는 &quot;광고&quot; 표시가 붙어요. 운영정책에 어긋난 문구·이미지·링크는 승인되지 않을 수 있어요.</li>
        <li className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden /> 승인(노출 시작) 이후에는 환불이 어려워요. 자세한 기준은 <a href="/policy#ads-refund" className="underline">운영정책</a>을 확인해주세요.</li>
      </ul>
      <button className="btn btn-primary btn-lg" disabled={missingImage}>슬라이드 광고 신청하기</button>
    </form>
  );
}
