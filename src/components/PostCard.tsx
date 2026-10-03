import Link from "next/link";
import { Eye, MapPin } from "lucide-react";
import { LIMITS } from "@/lib/constants";
import type { Post } from "@/lib/types";
import { formatCount, relativeTime } from "@/lib/utils";
import { CategoryBadge } from "./CategoryBadge";
import { PostImage } from "./PostImage";

const CARD_SIZES = "(min-width:1024px) 190px, (min-width:640px) 30vw, 46vw";

/** 모든 카테고리가 공유하는 홍보 카드 (대표 이미지 / 제목 / 한 줄 소개 / 카테고리 / 지역) */
export function PostCard({ post, eager = false, preview = false }: { post: Post; eager?: boolean; preview?: boolean }) {
  const inner = (
    <>
      <div className="relative">
        <PostImage src={post.primaryImageUrl} alt="" category={post.category} sizes={CARD_SIZES} eager={eager} />
        {post.region && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[11.5px] font-bold text-ink-2 shadow-sm">
            <MapPin size={11} aria-hidden />
            {post.region}
          </span>
        )}
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
          ) : (
            <span className="text-xs text-faint">{relativeTime(post.publishedAt)}</span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <article className="group relative h-full overflow-hidden rounded-[14px] border border-line bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-hover">
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
