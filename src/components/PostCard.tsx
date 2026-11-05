import Link from "next/link";
import { Eye, MapPin } from "lucide-react";
import { LIMITS, benefitLabels } from "@/lib/constants";
import type { Post } from "@/lib/types";
import { cn, formatCount, relativeTime } from "@/lib/utils";
import { BenefitBadges } from "./BenefitBadges";
import { CategoryBadge } from "./CategoryBadge";
import { isNewPost } from "./NewBadge";
import { OfficialBadge } from "./OfficialBadge";
import { PostImage } from "./PostImage";

const CARD_SIZES = "(min-width:1024px) 190px, (min-width:640px) 30vw, 46vw";

/** 모든 카테고리가 공유하는 홍보 카드 (대표 이미지 / 제목 / 한 줄 소개 / 카테고리 / 지역) */
export function PostCard({ post, eager = false, preview = false, ad = false, rank }: { post: Post; eager?: boolean; preview?: boolean; ad?: boolean; rank?: number }) {
  const inner = (
    <>
      <div className="relative">
        <PostImage src={post.primaryImageUrl} alt="" category={post.category} sizes={CARD_SIZES} eager={eager} />
        <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {rank != null && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[12px] font-extrabold tracking-tight text-white shadow-sm",
                rank === 1 ? "bg-[#f0a500]" : rank === 2 ? "bg-[#8a94a6]" : rank === 3 ? "bg-[#b9773a]" : "bg-ink/75",
              )}
            >
              {rank}위
            </span>
          )}
          {ad && <span className="rounded-md bg-ink/75 px-1.5 py-0.5 text-[11px] font-bold tracking-tight text-white backdrop-blur-sm">광고</span>}
          {isNewPost(post.publishedAt) && <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-ink-2 shadow-sm">NEW</span>}
          {post.region && !ad && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[11.5px] font-bold text-ink-2 shadow-sm">
              <MapPin size={11} aria-hidden />
              {post.region}
            </span>
          )}
        </div>
        {post.extra.official && <OfficialBadge value={post.extra.official} className="absolute right-2 top-2 z-10" />}
        {(post.extra.benefits?.length ?? 0) > 0 && <BenefitBadges values={post.extra.benefits} className="absolute bottom-2 left-2 z-10" />}
        {post.price && (
          <span className="absolute bottom-2 right-2 rounded-md bg-ink/80 px-1.5 py-0.5 text-[11.5px] font-bold text-white backdrop-blur-sm">
            {post.price}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[2.7em] text-[14.5px] font-bold leading-[1.35] tracking-[-0.02em] text-ink group-hover:text-brand-dark">
          {post.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-[12.5px] text-muted">{post.shortDescription}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <CategoryBadge slug={post.category} />
          {post.viewCount >= LIMITS.showViewsFrom ? (
            <span className="inline-flex items-center gap-1 text-xs text-faint">
              <Eye size={13} aria-hidden />
              {formatCount(post.viewCount)}
            </span>
          ) : Date.now() - new Date(post.publishedAt).getTime() < 7 * 86_400_000 ? (
            <span className="text-xs text-faint">{relativeTime(post.publishedAt)}</span>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <article className={cn("group relative h-full overflow-hidden rounded-[14px] border bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-hover", ad ? "border-[#f0b429]/70 ring-1 ring-[#f0b429]/30" : post.extra.benefits?.includes("exclusive") ? "border-line" : benefitLabels(post.extra.benefits).length > 0 ? "border-[#e5484d]/60 ring-1 ring-[#e5484d]/20" : "border-line")}>
      {preview ? (
        <div className="flex h-full flex-col">{inner}</div>
      ) : (
        <Link href={`/post/${post.id}`} className="flex h-full flex-col" aria-label={post.title}>
          {inner}
        </Link>
      )}
    </article>
  );
}
