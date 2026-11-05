"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, LoaderCircle, X } from "lucide-react";
import { AD_KIND_LABEL, AD_PLANS, AD_PRICES, won } from "@/lib/ads";
import { CREATIVE_SUBTITLE_MAX, CREATIVE_TITLE_MAX } from "@/lib/ad-creative";
import { processAndUpload } from "@/lib/image-client";
import type { AdCreative } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AdBanner, type AdBannerPost } from "./AdBanner";

type Mode = "auto" | "custom" | "upload";

const MODES: Array<{ value: Mode; title: string; desc: string }> = [
  { value: "auto", title: "자동 제작", desc: "내 홍보글의 사진·제목·소개로 배너를 만들어 드려요. (추천)" },
  { value: "custom", title: "직접 만들기", desc: "배경 사진과 문구를 직접 고르면 배너로 구성해 드려요." },
  { value: "upload", title: "완성 배너 올리기", desc: "이미 만든 배너 이미지를 그대로 올려요. (가로로 긴 4:1 권장)" },
];

/** 배너 전용 이미지 올리기 — 4:1 로 가운데를 맞춰 자르고 가로 1600px 이하로 줄여서 올립니다. */
function BannerImagePicker({ value, onChange, hint }: { value: string; onChange: (url: string) => void; hint: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setMsg(null);
    setBusy(true);
    try {
      onChange(await processAndUpload(file, { ratio: 4, maxWidth: 1600 }));
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

const radioCard =
  "flex cursor-pointer items-start gap-2 rounded-xl border border-line px-3.5 py-3 text-[14.5px] has-[:checked]:border-brand has-[:checked]:bg-brand-soft";

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
  const [mode, setMode] = useState<Mode>("auto");
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tone, setTone] = useState<"dark" | "light">("dark");

  const post = posts.find((p) => p.id === postId) ?? posts[0];
  const creative: AdCreative | null =
    kind !== "banner" || mode === "auto"
      ? null
      : mode === "upload"
        ? { mode: "upload", imageUrl }
        : { mode: "custom", imageUrl: imageUrl || undefined, title: title.trim() || undefined, subtitle: subtitle.trim() || undefined, tone };
  const uploadMissing = kind === "banner" && mode === "upload" && !imageUrl;

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

      {kind === "banner" && post && (
        <fieldset className="rounded-2xl border border-line bg-soft/60 p-4">
          <legend className="px-1 text-[14px] font-bold text-ink-2">배너 만드는 방법</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {MODES.map((m) => (
              <label key={m.value} className={cn(radioCard, "bg-white")}>
                <input type="radio" checked={mode === m.value} onChange={() => setMode(m.value)} className="mt-1 accent-[#f04f4a]" />
                <span>
                  <b className="block text-[14px]">{m.title}</b>
                  <span className="text-[12.5px] leading-snug text-muted">{m.desc}</span>
                </span>
              </label>
            ))}
          </div>

          {mode === "custom" && (
            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-1.5 text-[13.5px] font-bold text-ink-2">배경 사진 <span className="font-normal text-faint">(비우면 홍보글 대표 이미지)</span></p>
                <BannerImagePicker value={imageUrl} onChange={setImageUrl} hint="가로로 긴 사진이 잘 어울려요. 4:1로 가운데를 맞춰 자동으로 잘려요." />
              </div>
              <label className="block text-[13.5px] font-bold text-ink-2">
                배너 제목 <span className="font-normal text-faint">(비우면 홍보글 제목)</span>
                <input value={title} maxLength={CREATIVE_TITLE_MAX} onChange={(e) => setTitle(e.target.value)} placeholder={post.title} className="field mt-1.5" />
              </label>
              <label className="block text-[13.5px] font-bold text-ink-2">
                배너 문구 <span className="font-normal text-faint">(선택)</span>
                <input value={subtitle} maxLength={CREATIVE_SUBTITLE_MAX} onChange={(e) => setSubtitle(e.target.value)} placeholder="예) 오픈 기념 첫 주문 20% 할인" className="field mt-1.5" />
              </label>
              <fieldset>
                <legend className="mb-1.5 text-[13.5px] font-bold text-ink-2">글자 색</legend>
                <div className="flex gap-2">
                  {([["dark", "어두운 배경 · 흰 글씨"], ["light", "밝은 배경 · 어두운 글씨"]] as const).map(([v, l]) => (
                    <label key={v} className={cn(radioCard, "items-center bg-white py-2 text-[13.5px]")}>
                      <input type="radio" checked={tone === v} onChange={() => setTone(v)} className="accent-[#f04f4a]" />
                      {l}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {mode === "upload" && (
            <div className="mt-4">
              <BannerImagePicker
                value={imageUrl}
                onChange={setImageUrl}
                hint="권장 크기 1600×400px (가로:세로 = 4:1). 다른 비율은 가운데 기준으로 잘려요. 글자는 가운데 쪽에 넣어주세요. 이미지는 운영자 확인 후 노출돼요."
              />
            </div>
          )}

          <div className="mt-4">
            <p className="mb-1.5 text-[13.5px] font-bold text-ink-2">미리보기</p>
            {uploadMissing ? (
              <p className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-[13.5px] text-muted">배너 이미지를 올리면 여기에 미리 보여요.</p>
            ) : (
              <AdBanner post={post} creative={creative} preview />
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
      </ul>
      <button className="btn btn-primary btn-lg" disabled={uploadMissing}>
        광고 신청하기
      </button>
    </form>
  );
}
