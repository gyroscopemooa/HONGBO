import Link from "next/link";
import { BookOpen, ChevronRight, MessagesSquare, Star } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { REVIEW_CATEGORY_LABEL, type Review } from "@/lib/reviews";
import type { MeetupPost } from "@/lib/meetup-store";
import type { CommunityPost } from "@/lib/community";
import { COMMUNITY_TOPICS } from "@/lib/community";
import { relativeTime } from "@/lib/utils";

type BoardProps = { title: string; href: string; writeHref?: string; writeLabel?: string; icon: React.ReactNode; empty: string; children: React.ReactNode; count: number };

function Board({ title, href, writeHref, writeLabel, icon, empty, children, count }: BoardProps) {
  return (
    <section aria-label={title} className="min-w-0 rounded-2xl border border-line bg-white p-3 shadow-card sm:p-4">
      <div className="mb-1.5 flex items-center justify-between px-1.5 pt-1">
        <h2 className="flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.04em]">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-brand">{icon}</span>
          {title}
        </h2>
        <Link href={href} className="inline-flex items-center text-[13.5px] font-medium text-muted hover:text-brand">
          더보기 <ChevronRight size={15} aria-hidden />
        </Link>
      </div>
      {count > 0 ? (
        <ul className="divide-y divide-line/60">{children}</ul>
      ) : (
        <div className="px-2 py-8 text-center">
          <p className="text-[14px] text-muted">{empty}</p>
          {writeHref && (
            <Link href={writeHref} className="mt-2 inline-block text-[13.5px] font-bold text-brand hover:underline">
              {writeLabel}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

const rowCls = "block rounded-lg px-1.5 py-2.5 hover:bg-soft";

/** 홈 하단: 후기·리뷰 / 커뮤니티 / 홍보소모임 최신글 */
export function HomeBoards({ reviews, community, meetup }: { reviews: Review[]; community: CommunityPost[]; meetup: MeetupPost[] }) {
  return (
    <section aria-label="게시판 최신글" className="wrap pt-8">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-stretch gap-5 lg:grid-cols-3">
        <Board title="후기·리뷰 최신글" href="/reviews" writeHref="/reviews/write" writeLabel="첫 후기 남기기" icon={<Star size={16} aria-hidden />} empty="아직 올라온 후기가 없어요." count={reviews.length}>
          {reviews.map((r) => (
            <li key={r.id}>
              <Link href={`/reviews/${r.id}`} className={rowCls}>
                <p className="flex items-center gap-2 text-[12px] text-muted">
                  <StarRating value={r.rating} size={12} />
                  <span className="truncate">{REVIEW_CATEGORY_LABEL[r.category] ?? "기타·자유"} · {r.targetName}</span>
                </p>
                <p className="mt-0.5 truncate text-[14.5px] font-semibold text-ink">{r.title}</p>
                <p className="mt-0.5 text-xs text-faint">{r.nickname} · {relativeTime(r.createdAt)}</p>
              </Link>
            </li>
          ))}
        </Board>

        <Board title="운영자 가이드 최신글" href="/community" icon={<BookOpen size={16} aria-hidden />} empty="아직 올라온 글이 없어요." count={community.length}>
          {community.map((c) => (
            <li key={c.id}>
              <Link href={`/community/${c.id}`} className={rowCls}>
                <p className="text-[12px] text-muted">{COMMUNITY_TOPICS[c.topic as keyof typeof COMMUNITY_TOPICS] ?? "커뮤니티"}</p>
                <p className="mt-0.5 truncate text-[14.5px] font-semibold text-ink">{c.title}</p>
                <p className="mt-0.5 text-xs text-faint">{relativeTime(c.publishedAt ?? c.createdAt)}</p>
              </Link>
            </li>
          ))}
        </Board>

        <Board title="홍보소모임 최신글" href="/meetup" writeHref="/meetup/write" writeLabel="첫 글 쓰기" icon={<MessagesSquare size={16} aria-hidden />} empty="아직 올라온 글이 없어요." count={meetup.length}>
          {meetup.map((m) => (
            <li key={m.id}>
              <Link href={`/meetup/${m.id}`} className={rowCls}>
                <p className="truncate text-[14.5px] font-semibold text-ink">{m.title}</p>
                <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">{m.body}</p>
                <p className="mt-0.5 text-xs text-faint">{m.nickname} · {relativeTime(m.createdAt)}</p>
              </Link>
            </li>
          ))}
        </Board>
      </div>
    </section>
  );
}
