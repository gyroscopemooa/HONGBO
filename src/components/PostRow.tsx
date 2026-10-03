import Link from "next/link";
import type { Post } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { CategoryBadge } from "./CategoryBadge";
import { PostImage } from "./PostImage";

/** 최신 홍보글 리스트용 한 줄 카드 */
export function PostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-soft sm:gap-4 sm:px-3"
    >
      <div className="w-[76px] shrink-0 overflow-hidden rounded-lg sm:w-[88px]">
        <PostImage src={post.primaryImageUrl} alt="" category={post.category} sizes="88px" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <CategoryBadge slug={post.category} />
          <h3 className="truncate text-[14.5px] font-bold tracking-[-0.02em] text-ink group-hover:text-brand-dark sm:text-[15px]">
            {post.title}
          </h3>
        </div>
        <p className="mt-1 truncate text-[13px] text-muted">{post.shortDescription}</p>
      </div>
      <time dateTime={post.publishedAt} className="shrink-0 text-xs text-faint sm:text-[12.5px]">
        {relativeTime(post.publishedAt)}
      </time>
    </Link>
  );
}
