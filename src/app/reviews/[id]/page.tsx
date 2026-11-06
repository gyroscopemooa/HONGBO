import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ReviewBody } from "@/components/ReviewBody";
import { ReviewDeleteButton, ReviewReportButton } from "@/components/ReviewActions";
import { StarRating } from "@/components/StarRating";
import { YoutubeEmbed } from "@/components/YoutubeEmbed";
import { getCurrentUser } from "@/lib/auth";
import { getReview, listReviewReports } from "@/lib/review-store";
import { REVIEW_CATEGORY_LABEL, REVIEW_REPORT_REASONS } from "@/lib/reviews";
import { formatDate, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const parseId = (raw: string) => (/^\d{1,12}$/.test(raw) ? Number(raw) : 0);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getReview(parseId((await params).id));
  if (!post) return { title: "후기·리뷰" };
  return {
    title: `${post.title} - ${post.targetName} 후기`,
    description: `${post.targetName} 후기 ${post.rating}점 · ${post.body.replace(/\s+/g, " ").slice(0, 110)}`,
    alternates: { canonical: `/reviews/${post.id}` },
  };
}

export default async function ReviewDetailPage({ params }: Props) {
  const post = await getReview(parseId((await params).id));
  if (!post) notFound();
  const user = await getCurrentUser();
  const canDelete = !!user && (user.isAdmin || user.id === post.authorId);
  const reports = user?.isAdmin ? await listReviewReports(post.id) : [];

  return (
    <div className="wrap max-w-[760px] py-8 sm:py-10">
      <Link href="/reviews" className="text-[13.5px] font-medium text-muted hover:text-brand">
        ← 후기·리뷰
      </Link>
      <article className="mt-3 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">
        <p className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="rounded-md bg-soft px-2 py-0.5 font-bold text-muted">{REVIEW_CATEGORY_LABEL[post.category] ?? "기타·자유"}</span>
          <span className="font-bold text-ink-2">{post.targetName}</span>
          {post.targetUrl && (
            <a href={post.targetUrl} target="_blank" rel="nofollow ugc noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
              업체 링크 <ExternalLink size={12} aria-hidden />
            </a>
          )}
        </p>
        <h1 className="mt-2 text-[22px] font-black leading-snug tracking-[-0.03em]">{post.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <StarRating value={post.rating} size={20} />
          <span className="text-[15px] font-extrabold text-[#c47d0a]">{post.rating}.0</span>
        </div>
        <p className="mt-2 text-[13px] text-faint">
          {post.nickname} · <time dateTime={post.createdAt} title={formatDate(post.createdAt)}>{relativeTime(post.createdAt)}</time>
        </p>

        {post.images.length > 0 && (
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {post.images.map((src, i) => (
              <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-line bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${post.targetName} 후기 사진 ${i + 1}`} loading="lazy" className="max-h-[420px] w-full object-contain" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-5">
          <ReviewBody body={post.body} />
        </div>

        {post.youtubeId && (
          <div className="mt-5">
            <YoutubeEmbed id={post.youtubeId} title={post.title} />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-start justify-between gap-3 border-t border-line pt-4">
          <ReviewReportButton id={post.id} />
          {canDelete && <ReviewDeleteButton id={post.id} />}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-faint">후기는 작성자 개인의 경험과 의견이며 더홍보의 입장과 무관합니다. 문제가 있는 후기는 신고해 주세요.</p>

        {user?.isAdmin && (
          <section className="mt-5 rounded-xl bg-[#fff7e0] p-4 text-[13px]" aria-label="관리자용 신고 내역">
            <p className="font-bold text-[#8a6105]">관리자 전용 · 신고 {reports.length}건</p>
            {reports.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {reports.map((r, i) => (
                  <li key={i} className="text-ink-2">
                    <b>{REVIEW_REPORT_REASONS[r.reason] ?? r.reason}</b>
                    {r.detail ? ` · ${r.detail}` : ""} <span className="text-faint">({formatDate(r.createdAt)})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </article>
    </div>
  );
}
