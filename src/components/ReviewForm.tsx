"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createReviewAction } from "@/app/actions/reviews";
import { ImageSlot } from "@/components/form/parts";
import { REVIEW_CATEGORIES, REVIEW_LIMITS } from "@/lib/reviews";
import { cn } from "@/lib/utils";

export function ReviewForm() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<{ text: string; login?: boolean } | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      setError(null);
      if (busy > 0) return setError({ text: "사진을 올리는 중이에요. 잠시만 기다려주세요." });
      const r = await createReviewAction({ category, targetName, rating, title, body, images, videoUrl, targetUrl });
      if (r.ok) {
        router.push(`/reviews/${r.id}`);
        router.refresh();
        return;
      }
      setError({ text: r.message, login: r.login });
    });

  const shown = hover || rating;
  const label = "mb-1.5 block text-sm font-semibold text-ink-2";

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"
    >
      <p className="rounded-xl bg-soft px-4 py-3 text-[13px] leading-relaxed text-muted">
        직접 이용해 보신 경험만 사실대로 적어주세요. 허위·비방·광고성 글, 본인이나 관계자가 쓴 후기는 삭제될 수 있어요. 개인정보(연락처·계좌 등)는 적지 마세요.
      </p>

      <div>
        <label htmlFor="review-category" className={label}>후기 종류</label>
        <select id="review-category" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
          <option value="">종류를 선택해주세요</option>
          {REVIEW_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="review-target" className={label}>업체·서비스 이름</label>
          <input id="review-target" value={targetName} maxLength={REVIEW_LIMITS.targetMax} onChange={(e) => setTargetName(e.target.value)} className="field" placeholder="예) 홍길동 카페, ○○ 앱" />
        </div>
        <div>
          <label htmlFor="review-url" className={label}>업체 링크 <span className="font-normal text-faint">(선택)</span></label>
          <input id="review-url" value={targetUrl} maxLength={300} onChange={(e) => setTargetUrl(e.target.value)} className="field" placeholder="https://" />
        </div>
      </div>

      <div>
        <span className={label} id="review-rating-label">별점</span>
        <div role="radiogroup" aria-labelledby="review-rating-label" className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n}점`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Star size={32} className={cn("transition", n <= shown ? "fill-[#f5a623] text-[#f5a623]" : "fill-transparent text-[#d3d6dc]")} aria-hidden />
            </button>
          ))}
          <span className="ml-2 text-sm font-semibold text-ink-2">{rating ? `${rating}점` : "선택해주세요"}</span>
        </div>
      </div>

      <div>
        <label htmlFor="review-title" className={label}>제목</label>
        <input id="review-title" value={title} maxLength={REVIEW_LIMITS.titleMax} onChange={(e) => setTitle(e.target.value)} className="field" placeholder="한 줄로 요약해주세요" />
      </div>

      <div>
        <label htmlFor="review-body" className={label}>후기 내용</label>
        <textarea
          id="review-body"
          rows={10}
          maxLength={REVIEW_LIMITS.bodyMax}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="field resize-y leading-relaxed"
          placeholder="어떤 점이 좋았고 아쉬웠는지 자세히 적어주세요. http:// 또는 https:// 로 시작하는 주소는 링크로 걸려요. (링크는 5개까지)"
        />
        <p className="mt-1 text-right text-xs text-faint">{body.length.toLocaleString()} / {REVIEW_LIMITS.bodyMax.toLocaleString()}</p>
      </div>

      <div>
        <span className={label}>사진 <span className="font-normal text-faint">(선택, 최대 {REVIEW_LIMITS.imagesMax}장)</span></span>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {images.map((url, i) => (
            <ImageSlot key={url} size="sm" keepOriginal value={url} alt={`후기 사진 ${i + 1}`} onChange={(u) => setImages(u ? images.map((x, idx) => (idx === i ? u : x)) : images.filter((_, idx) => idx !== i))} onBusyChange={(b) => setBusy((n) => n + (b ? 1 : -1))} />
          ))}
          {images.length < REVIEW_LIMITS.imagesMax && (
            <ImageSlot key={`new-${images.length}`} size="sm" keepOriginal value={null} alt="" onChange={(u) => u && setImages([...images, u])} onBusyChange={(b) => setBusy((n) => n + (b ? 1 : -1))} />
          )}
        </div>
      </div>

      <div>
        <label htmlFor="review-video" className={label}>유튜브 영상 <span className="font-normal text-faint">(선택)</span></label>
        <input id="review-video" value={videoUrl} maxLength={300} onChange={(e) => setVideoUrl(e.target.value)} className="field" placeholder="https://www.youtube.com/watch?v=…" />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-brand-dark">
          {error.text}{" "}
          {error.login && (
            <Link href="/auth?next=/reviews/write" className="font-bold underline">로그인하기</Link>
          )}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Link href="/reviews" className="btn btn-outline">취소</Link>
        <button type="submit" disabled={pending} className="btn btn-primary min-w-[120px]">{pending ? "올리는 중…" : "후기 올리기"}</button>
      </div>
    </form>
  );
}
