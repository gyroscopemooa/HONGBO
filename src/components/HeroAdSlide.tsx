import { heroTheme, type HeroAd } from "@/lib/hero-ads";

/** 화면에 필요한 값만 — 서버에서 클라이언트(Hero)로 넘길 수 있는 가벼운 형태 */
export type HeroAdView = Pick<HeroAd, "id" | "designMode" | "title" | "subtitle" | "buttonText" | "theme" | "imageUrl" | "linkMode" | "linkUrl">;

const BADGE = "absolute left-2 top-2 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white sm:text-[11px]";

/** 슬라이드 안쪽 모양 — 부모 크기(가로세로 2172:724)에 꽉 차게 그립니다. 부모에 container-type:inline-size 필요. */
export function HeroAdFace({ ad }: { ad: HeroAdView }) {
  if (ad.designMode === "image" && ad.imageUrl) {
    return (
      <>
        <span className={BADGE}>광고</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.imageUrl} alt={ad.title ?? "광고"} className="absolute inset-0 size-full object-cover" loading="lazy" />
      </>
    );
  }
  const t = heroTheme(ad.theme);
  const clickable = ad.linkMode === "url" && !!ad.linkUrl;
  return (
    <div className="flex size-full items-center justify-between gap-[3cqw] px-[6cqw]" style={{ background: t.bg }}>
      <span className={BADGE}>광고</span>
      <div className="min-w-0 flex-1">
        <p className="font-black leading-tight tracking-[-0.04em]" style={{ color: t.ink, fontSize: "clamp(15px, 3.3cqw, 48px)" }}>
          {ad.title || "광고 제목"}
        </p>
        {ad.subtitle && (
          <p className="mt-[1cqw] leading-snug" style={{ color: t.sub, fontSize: "clamp(11px, 1.6cqw, 22px)" }}>
            {ad.subtitle}
          </p>
        )}
      </div>
      {clickable && (
        <span
          className="shrink-0 whitespace-nowrap rounded-full font-bold text-white"
          style={{ background: t.btn, fontSize: "clamp(11px, 1.6cqw, 22px)", padding: "clamp(6px, 1cqw, 14px) clamp(12px, 2.4cqw, 34px)" }}
        >
          {ad.buttonText || "자세히 보기"}
        </span>
      )}
    </div>
  );
}

/** 신청 폼·관리자 화면용 미리보기 (홈 슬라이드와 같은 비율) */
export function HeroAdPreview({ ad }: { ad: HeroAdView }) {
  return (
    <div className="relative aspect-[2172/724] w-full overflow-hidden rounded-xl border border-line" style={{ containerType: "inline-size" }}>
      <HeroAdFace ad={ad} />
    </div>
  );
}
