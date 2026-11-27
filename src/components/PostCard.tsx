"use client";

import { SHOW_POST_SOCIAL } from "@/lib/features";
import Link from "next/link";
import { Eye, MapPin, MessageCircle, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { CATEGORY_MAP, LIMITS, benefitLabels, SERVICE_FIELDS, isServiceField } from "@/lib/constants";
import type { Post } from "@/lib/types";
import { productDiscount } from "@/lib/product-price";
import { cn, formatCount, isWithinWeek, relativeTime } from "@/lib/utils";
import { BenefitBadges } from "./BenefitBadges";
import { CategoryBadge } from "./CategoryBadge";
import { isNewPost } from "./NewBadge";
import { OfficialBadge } from "./OfficialBadge";
import { GlassLens } from "./GlassLens";
import { PostImage } from "./PostImage";

const CARD_SIZES = "(min-width:1024px) 190px, (min-width:640px) 30vw, 46vw";

const HIDE_KEY = "hb-hidden-posts-until";
const DUST_SPRING = { stiffness: 260, damping: 24 };
const SEOUL_DATE = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

function hiddenToday(postId: string) {
  try { const saved: Record<string, string> = JSON.parse(localStorage.getItem(HIDE_KEY) ?? "{}"); return saved[postId] === SEOUL_DATE(); } catch { return false; }
}
function rememberHiddenToday(postId: string) {
  try { const saved: Record<string, string> = JSON.parse(localStorage.getItem(HIDE_KEY) ?? "{}"); localStorage.setItem(HIDE_KEY, JSON.stringify({ ...saved, [postId]: SEOUL_DATE() })); } catch { /* 이번 화면에서만 숨김 */ }
}
function DustDismissButton({ postId, title, thumbnailRef, onDone }: { postId: string; title: string; thumbnailRef: RefObject<HTMLDivElement | null>; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const frameRef = useRef<number | null>(null);
  useEffect(() => () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); }, []);
  const dismiss = () => {
    if (!window.confirm(`“${title}” 홍보를 오늘은 보지 않을까요?\n내일 다시 표시됩니다.`)) return;
    rememberHiddenToday(postId); const host = thumbnailRef.current; const canvas = canvasRef.current;
    if (!host || !canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) { onDone(); return; }
    const rect = host.getBoundingClientRect(); const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio)); canvas.height = Math.max(1, Math.round(rect.height * ratio)); canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`; canvas.style.opacity = "1";
    const ctx = canvas.getContext("2d"); if (!ctx) { onDone(); return; } ctx.scale(ratio, ratio);
    const dots = Array.from({ length: Math.min(1200, Math.max(260, Math.round(rect.width * rect.height / 18))) }, () => { const x = Math.random() * rect.width; const y = Math.random() * rect.height; return { x, y, delay: ((rect.width - x) / rect.width) * 260 + Math.random() * 90, vx: -(55 + Math.random() * 165), vy: -(20 + Math.random() * 90), color: Math.random() > .66 ? "240,79,74" : Math.random() > .5 ? "255,255,255" : "58,62,71" }; });
    const started = performance.now();
    const draw = (now: number) => { const elapsed = now - started; ctx.clearRect(0, 0, rect.width, rect.height); for (const dot of dots) { const age = Math.max(0, elapsed - dot.delay); const progress = Math.min(1, age / 650); if (!progress) continue; const drift = age / 1000; ctx.fillStyle = `rgba(${dot.color},${1 - progress})`; ctx.fillRect(dot.x + dot.vx * drift + Math.sin(age / 90 + dot.y) * 5 * drift, dot.y + dot.vy * drift + 50 * drift * drift, 2, 2); } if (elapsed < 860) frameRef.current = requestAnimationFrame(draw); else onDone(); };
    host.style.transition = `opacity 860ms cubic-bezier(.22,1,.36,1), transform ${Math.round(1000 / DUST_SPRING.damping * DUST_SPRING.stiffness / 26)}ms cubic-bezier(.22,1,.36,1)`; host.style.opacity = "0"; host.style.transform = "scale(.985)"; frameRef.current = requestAnimationFrame(draw);
  };
  return <><canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-20 size-full opacity-0" /><button type="button" onClick={dismiss} aria-label={`${title} 오늘 안 보기`} title="오늘 안 보기" className="absolute right-1.5 top-1.5 z-30 grid size-7 place-items-center rounded-full bg-white/95 text-lg font-medium leading-none text-ink-2 shadow-sm transition-[transform,background-color] duration-200 hover:scale-110 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">×</button></>;
}

/** 모든 카테고리가 공유하는 홍보 카드 (대표 이미지 / 제목 / 한 줄 소개 / 카테고리 / 지역) */
export function PostCard({ post, eager = false, preview = false, ad = false, rank }: { post: Post; eager?: boolean; preview?: boolean; ad?: boolean; rank?: number }) {
  const hiddenStored = useSyncExternalStore(() => () => {}, () => hiddenToday(String(post.id)), () => false);
  const [dismissed, setDismissed] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const fresh = isNewPost(post.publishedAt);
  const price = post.price?.trim();
  const discount = post.category === "products" ? productDiscount(post.extra.regularPrice, price) : null;
  if (hiddenStored || dismissed) return null;
  const inner = (
    <>
      <div ref={thumbnailRef} className="relative">
        <PostImage src={post.primaryImageUrl} alt="" category={post.category} sizes={CARD_SIZES} eager={eager} />
        {ad && <GlassLens src={post.primaryImageUrl || CATEGORY_MAP[post.category].defaultImage} size={104} />}
        <div className="pointer-events-none absolute inset-x-1.5 top-1.5 z-10 flex items-start justify-between gap-1">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            {rank != null && (
              <span className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-extrabold leading-tight text-white shadow-sm",
                rank === 1 ? "bg-[#f0a500]" : rank === 2 ? "bg-[#8a94a6]" : rank === 3 ? "bg-[#b9773a]" : "bg-ink/75",
              )}>{rank}위</span>
            )}
            {ad && <span className="max-w-full truncate rounded-md bg-ink/80 px-1 py-0.5 text-[10px] font-bold leading-tight text-white" title={post.adFree ? "더홍보 지정 무료홍보" : "추천"}>{post.adFree ? "지정 무료홍보" : "추천"}</span>}
            {fresh && <span className="rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-ink-2 shadow-sm">NEW</span>}
            {post.region && !ad && (
              <span className="inline-flex max-w-full items-center gap-0.5 rounded-md bg-white/95 px-1 py-0.5 text-[10px] font-bold leading-tight text-ink-2 shadow-sm">
                <MapPin size={10} aria-hidden className="shrink-0" />
                <span className="truncate">{post.region}</span>
              </span>
            )}
          </div>
          {post.extra.official && <OfficialBadge value={post.extra.official} className="shrink-0 whitespace-nowrap !gap-0.5 !px-1 !text-[10px] !leading-tight [&>svg]:size-2.5" />}
        </div>
        <BenefitBadges values={post.extra.benefits} className="pointer-events-none absolute inset-x-1.5 bottom-1.5 z-10 !flex-nowrap !gap-0.5 overflow-hidden [&>span]:shrink-0 [&>span]:whitespace-nowrap [&>span]:!px-1 [&>span]:!text-[10px] [&>span]:leading-tight" />
      </div>
      {/* Fixed text/footer tracks keep every card in a grid or slider the same size. */}
      <div className="grid min-w-0 flex-none grid-rows-[79px_20px] gap-1 p-2 sm:p-2.5">
        <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden">
          <h3 className="line-clamp-2 shrink-0 text-[14px] font-bold leading-[19px] tracking-[-0.02em] text-ink group-hover:text-brand-dark">
            {post.title}
          </h3>
          {price && (
            <p title={price} className="line-clamp-1 shrink-0 text-[12.5px] font-bold leading-[17px] text-ink [overflow-wrap:anywhere]">
              {discount != null && <><span className="mr-1 text-brand">{discount}% 할인</span><s className="mr-1 font-normal text-muted">{post.extra.regularPrice}</s></>}
              {price}
            </p>
          )}
          {post.shortDescription && (
            <p className={cn("shrink-0 overflow-hidden text-[12px] leading-[17px] text-muted [overflow-wrap:anywhere]", price ? "line-clamp-1" : "line-clamp-2")}>{post.shortDescription}</p>
          )}
        </div>
        <div className="flex min-w-0 items-center justify-between gap-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            <CategoryBadge slug={post.category} className="whitespace-nowrap !text-[10.5px]" />
            {post.category === "services" && isServiceField(post.extra.serviceField) && <span className="truncate text-[10.5px] font-semibold text-muted">{SERVICE_FIELDS[post.extra.serviceField].name}</span>}
            {SHOW_POST_SOCIAL && <>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[10.5px] text-muted" aria-label={`좋아요 ${post.likeCount ?? 0}개`}>
                <ThumbsUp size={11} aria-hidden /> {formatCount(post.likeCount ?? 0)}
              </span>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[10.5px] text-muted" aria-label={`댓글 ${post.commentCount ?? 0}개`}>
                <MessageCircle size={11} aria-hidden /> {formatCount(post.commentCount ?? 0)}
              </span>
            </>}
          </div>
          {post.viewCount >= LIMITS.showViewsFrom ? (
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[10.5px] text-faint">
              <Eye size={13} aria-hidden />
              {formatCount(post.viewCount)}
            </span>
          ) : isWithinWeek(post.publishedAt) ? (
            <span className="shrink-0 whitespace-nowrap text-[10.5px] text-faint">{relativeTime(post.publishedAt)}</span>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <article className={cn("group relative h-full min-w-0 overflow-hidden rounded-[14px] border bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-hover", ad ? "border-[#f0b429]/70 ring-1 ring-[#f0b429]/30" : post.extra.benefits?.includes("exclusive") ? "border-line" : benefitLabels(post.extra.benefits).length > 0 ? "border-[#e5484d]/60 ring-1 ring-[#e5484d]/20" : "border-line")}>
      {preview ? (
        <div className="flex h-full flex-col">{inner}</div>
      ) : (
        <>
          <Link href={`/post/${post.id}`} className="flex h-full flex-col" aria-label={post.title}>{inner}</Link>
          <DustDismissButton postId={String(post.id)} title={post.title} thumbnailRef={thumbnailRef} onDone={() => setDismissed(true)} />
        </>
      )}
    </article>
  );
}
