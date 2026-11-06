"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, LoaderCircle, X } from "lucide-react";
import { AD_KIND_LABEL, AD_PLANS, AD_PRICES, won } from "@/lib/ads";
import { CREATIVE_SUBTITLE_MAX, CREATIVE_TITLE_MAX } from "@/lib/ad-creative";
import { processAndUpload, type ProcessOptions } from "@/lib/image-client";
import type { AdCreative, Post } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AdBanner, type AdBannerPost } from "./AdBanner";
import { PostCard } from "./PostCard";

type BannerMode = "auto" | "custom" | "upload";
type PremiumMode = "auto" | "custom";

const BANNER_MODES: Array<{ value: BannerMode; title: string; desc: string }> = [
  { value: "auto", title: "내 홍보글 그대로", desc: "등록한 글의 사진·제목·소개로 배너를 만들어 드려요. (기본)" },
  { value: "custom", title: "직접 만들기", desc: "배경 사진과 문구를 새로 고르면 배너로 구성해 드려요." },
  { value: "upload", title: "완성 배너 올리기", desc: "이미 만든 배너 이미지를 그대로 올려요. (가로로 긴 4:1)" },
];

const PREMIUM_MODES: Array<{ value: PremiumMode; title: string; desc: string }> = [
  { value: "auto", title: "내 홍보글 그대로", desc: "등록한 글의 대표 이미지·제목·소개를 그대로 써요. (기본)" },
  { value: "custom", title: "광고용으로 새로 정하기", desc: "광고에만 쓸 이미지와 문구를 따로 올려요. 링크는 내 홍보글로 이동해요." },
];

/** 이미지 올리기 — 지정한 비율로 가운데를 맞춰 자르고 줄여서 올립니다. */
export function ImagePicker({ value, onChange, hint, opts }: { value: string; onChange: (url: string) => void; hint: string; opts: ProcessOptions }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setMsg(null);
    setBusy(true);
    try {
      onChange(await processAndUpload(file, opts));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "이미지를 올리지 못했어요.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn btn-outline btn-sm">
          {busy ? <LoaderCircle size={15} className="animate-spin" aria-hidden /> : <ImagePlus size={15} aria-hidden />}
          {value ? "이미지 바꾸기" : "이미지 선택"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-brand">
            <X size={14} aria-hidden /> 지우기
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[12.5px] text-muted">{hint}</p>
      {msg && <p role="alert" className="mt-1 text-[13px] font-medium text-brand-dark">{msg}</p>}
    </div>
  );
}

const BANNER_IMG: ProcessOptions = { ratio: 4, maxWidth: 1600 };
const CARD_IMG: ProcessOptions = { ratio: 16 / 9, maxWidth: 960 };

const radioCard =
  "flex cursor-pointer items-start gap-2 rounded-xl border border-line px-3.5 py-3 text-[14.5px] has-[:checked]:border-brand has-[:checked]:bg-brand-soft";

/** 미리보기 고정 샘플 — 신청자의 글이 아니라 항상 실제 홍보글(/post/41, TranStream)을 예시로 보여줍니다. */
const SAMPLE_POST: AdBannerPost = {
  id: 41,
  category: "apps",
  title: "해외 라이브 방송을 내 언어로, TranStream",
  shortDescription: "실시간 자막과 번역으로 해외 라이브·스트리밍을 더 편하게 즐겨보세요.",
  primaryImageUrl: "https://yqtqkwairbrlyifdiory.supabase.co/storage/v1/object/public/post-images/db3f5749-98e1-4ae0-8963-9be3a0abfcd8/4ab89993-14a6-4dc6-a43b-d27e0a8a0156.webp",
  extra: {},
};

/** 미리보기용으로 최소 정보만 있는 글을 카드가 받는 형태로 맞춥니다. */
function toPreviewPost(p: AdBannerPost, ov: { image?: string; title?: string; sub?: string }): Post {
  const old = "2000-01-01T00:00:00.000Z";
  return {
    ...p,
    primaryImageUrl: ov.image || p.primaryImageUrl,
    title: ov.title || p.title,
    shortDescription: ov.sub || p.shortDescription,
    authorId: null,
    description: "",
    images: [],
    externalUrl: null,
    platform: null,
    price: null,
    region: null,
    address: null,
    mapUrl: null,
    tags: [],
    contact: null,
    status: "active",
    adminPinned: false,
    curatedRank: null,
    isSeed: false,
    viewCount: 0,
    clickCount: 0,
    publishedAt: old,
    bumpedAt: old,
    updatedAt: old,
    expiresAt: null,
  };
}

export function AdRequestForm({
  posts,
  action,
}: {
  posts: AdBannerPost[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [postId, setPostId] = useState(posts[0]?.id ?? 0);
  const [kind, setKind] = useState<"premium" | "banner">("premium");
  const [plan, setPlan] = useState<"week" | "month">("month");
  const [bMode, setBMode] = useState<BannerMode>("auto");
  const [pMode, setPMode] = useState<PremiumMode>("auto");
  const [bannerImg, setBannerImg] = useState("");
  const [cardImg, setCardImg] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tone, setTone] = useState<"dark" | "light">("dark");

  const post = posts.find((p) => p.id === postId) ?? posts[0];
  const t = title.trim();
  const s = subtitle.trim();

  let creative: AdCreative | null = null;
  if (kind === "banner") {
    if (bMode === "upload") creative = { mode: "upload", imageUrl: bannerImg };
    else if (bMode === "custom") creative = { mode: "custom", imageUrl: bannerImg || undefined, title: t || undefined, subtitle: s || undefined, tone };
  } else if (pMode === "custom") {
    creative = { mode: "custom", imageUrl: cardImg || undefined, title: t || undefined, subtitle: s || undefined };
  }
  const uploadMissing = kind === "banner" && bMode === "upload" && !bannerImg;
  const showText = (kind === "banner" && bMode === "custom") || (kind === "premium" && pMode === "custom");

  return (
    <form action={action} className="mt-4 space-y-5">
      <input type="hidden" name="creative" value={creative ? JSON.stringify(creative) : ""} />

      <label className="block text-[14px] font-bold text-ink-2">
        광고할 홍보글
        <select name="postId" required value={postId} onChange={(e) => setPostId(Number(e.target.value))} className="field mt-1.5">
          {posts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="mb-1.5 text-[14px] font-bold text-ink-2">상품</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["premium", "banner"] as const).map((k) => (
            <label key={k} className={radioCard}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="mt-1 accent-[#f04f4a]" />
              {AD_KIND_LABEL[k]}
            </label>
          ))}
        </div>
      </fieldset>

      {post && (
        <fieldset className="rounded-2xl border border-line bg-soft/60 p-4">
          <legend className="px-1 text-[14px] font-bold text-ink-2">{kind === "banner" ? "배너 만드는 방법" : "광고 이미지·문구"}</legend>

          <div className={cn("grid gap-2", kind === "banner" ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            {(kind === "banner" ? BANNER_MODES : PREMIUM_MODES).map((m) => (
              <label key={m.value} className={cn(radioCard, "bg-white")}>
                <input
                  type="radio"
                  checked={kind === "banner" ? bMode === m.value : pMode === m.value}
                  onChange={() => (kind === "banner" ? setBMode(m.value as BannerMode) : setPMode(m.value as PremiumMode))}
                  className="mt-1 accent-[#f04f4a]"
                />
                <span>
                  <b className="block text-[14px]">{m.title}</b>
                  <span className="text-[12.5px] leading-snug text-muted">{m.desc}</span>
                </span>
              </label>
            ))}
          </div>

          {showText && (
            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-1.5 text-[13.5px] font-bold text-ink-2">
                  {kind === "banner" ? "배경 사진" : "광고 이미지"} <span className="font-normal text-faint">(비우면 홍보글 대표 이미지)</span>
                </p>
                {kind === "banner" ? (
                  <ImagePicker value={bannerImg} onChange={setBannerImg} opts={BANNER_IMG} hint="가로로 긴 사진이 잘 어울려요. 4:1로 가운데를 맞춰 자동으로 잘려요." />
                ) : (
                  <ImagePicker value={cardImg} onChange={setCardImg} opts={CARD_IMG} hint="권장 960×540px (16:9). 다른 비율은 가운데 기준으로 잘려요." />
                )}
              </div>
              <label className="block text-[13.5px] font-bold text-ink-2">
                제목 <span className="font-normal text-faint">(비우면 홍보글 제목)</span>
                <input value={title} maxLength={CREATIVE_TITLE_MAX} onChange={(e) => setTitle(e.target.value)} placeholder={post.title} className="field mt-1.5" />
              </label>
              <label className="block text-[13.5px] font-bold text-ink-2">
                {kind === "banner" ? "문구" : "한 줄 소개"} <span className="font-normal text-faint">(선택)</span>
                <input value={subtitle} maxLength={CREATIVE_SUBTITLE_MAX} onChange={(e) => setSubtitle(e.target.value)} placeholder="예) 오픈 기념 첫 주문 20% 할인" className="field mt-1.5" />
              </label>
              {kind === "banner" && (
                <fieldset>
                  <legend className="mb-1.5 text-[13.5px] font-bold text-ink-2">글자 색</legend>
                  <div className="flex flex-wrap gap-2">
                    {([["dark", "어두운 배경 · 흰 글씨"], ["light", "밝은 배경 · 어두운 글씨"]] as const).map(([v, l]) => (
                      <label key={v} className={cn(radioCard, "items-center bg-white py-2 text-[13.5px]")}>
                        <input type="radio" checked={tone === v} onChange={() => setTone(v)} className="accent-[#f04f4a]" />
                        {l}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          )}

          {kind === "banner" && bMode === "upload" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-line bg-white p-3.5 text-[13px] leading-relaxed text-ink-2">
                <p className="font-bold">배너 이미지 규격</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted">
                  <li>권장 크기 <b className="text-ink-2">1600 × 400px</b> (가로:세로 = 4:1) · 최소 800 × 200px</li>
                  <li>JPG · PNG · WebP, 올릴 때 자동으로 줄여져요 (원본 25MB 이하)</li>
                  <li>비율이 다르면 가운데를 기준으로 4:1로 잘려요</li>
                  <li><b className="text-ink-2">모바일에서는 양쪽 끝이 조금 잘려 보여요.</b> 글자와 로고는 가운데 70% 안쪽에 넣어주세요</li>
                  <li>&quot;광고&quot; 표시가 왼쪽 위 모서리에 붙어요. 그 자리에는 중요한 내용을 넣지 마세요</li>
                  <li>이미지는 운영자가 확인한 뒤 승인돼요</li>
                </ul>
              </div>
              <ImagePicker value={bannerImg} onChange={setBannerImg} opts={BANNER_IMG} hint="이미지를 고르면 아래 미리보기에서 PC 화면 기준으로 바로 확인할 수 있어요." />
            </div>
          )}

          <div className="mt-4">
            <p className="mb-1.5 text-[13.5px] font-bold text-ink-2">{kind === "banner" ? "배너가 이렇게 보여요" : "고정 광고 카드가 이렇게 보여요"} <span className="font-normal text-muted">(예시 화면)</span></p>
            {kind === "banner" ? (
              uploadMissing ? (
                <p className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-[13.5px] text-muted">배너 이미지를 올리면 여기에 미리 보여요.</p>
              ) : (
                <AdBanner post={SAMPLE_POST} creative={creative} preview />
              )
            ) : (
              <div className="w-full max-w-[220px]">
                <PostCard post={toPreviewPost(SAMPLE_POST, { image: pMode === "custom" ? cardImg : "", title: pMode === "custom" ? t : "", sub: pMode === "custom" ? s : "" })} ad preview />
              </div>
            )}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-1.5 text-[14px] font-bold text-ink-2">기간</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["week", "month"] as const).map((p) => (
            <label key={p} className={cn(radioCard, "items-center")}>
              <input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} className="accent-[#f04f4a]" />
              {AD_PLANS[p].label}
              <span className="ml-auto text-[12.5px] text-muted">{won(AD_PRICES[kind][p])}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <ul className="space-y-1 text-[13px] text-muted">
        <li className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden /> 신청하면 바로 입금 계좌가 안내돼요. 입금이 확인되어 승인된 시점부터 기간이 시작돼요.</li>
        <li className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden /> 광고 카드에는 &quot;광고&quot; 표시가 붙어요. 운영정책에 어긋난 글·문구·이미지는 승인되지 않을 수 있어요.</li>
        <li className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden /> 승인(노출 시작) 이후에는 환불이 어려워요. 자세한 기준은 <a href="/policy#ads-refund" className="underline">운영정책</a>을 확인해주세요.</li>
      </ul>
      <button className="btn btn-primary btn-lg" disabled={uploadMissing}>
        광고 신청하기
      </button>
    </form>
  );
}
