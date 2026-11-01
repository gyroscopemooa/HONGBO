import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MeetupDeleteButton } from "@/components/MeetupDeleteButton";
import { getCurrentUser } from "@/lib/auth";
import { getMeetup } from "@/lib/meetup-store";
import { formatDate, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getMeetup(Number((await params).id));
  if (!post) return { title: "홍보소모임" };
  return { title: `${post.title} - 홍보소모임`, description: post.body.replace(/\s+/g, " ").slice(0, 120), alternates: { canonical: `/meetup/${post.id}` } };
}

export default async function MeetupDetailPage({ params }: Props) {
  const post = await getMeetup(Number((await params).id));
  if (!post) notFound();
  const user = await getCurrentUser();
  const canDelete = !!user && (user.isAdmin || user.id === post.authorId);

  return (
    <div className="wrap max-w-[760px] py-8 sm:py-10">
      <Link href="/meetup" className="text-[13.5px] font-medium text-muted hover:text-brand">
        ← 홍보소모임
      </Link>
      <article className="mt-3 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">
        <h1 className="text-[22px] font-black leading-snug tracking-[-0.03em]">{post.title}</h1>
        <p className="mt-2 text-[13px] text-faint">
          {post.nickname} · <time dateTime={post.createdAt} title={formatDate(post.createdAt)}>{relativeTime(post.createdAt)}</time>
        </p>
        <div className="mt-5 whitespace-pre-wrap break-words text-[15.5px] leading-[1.75] text-ink-2">{post.body}</div>
        {canDelete && (
          <div className="mt-6 border-t border-line pt-4">
            <MeetupDeleteButton id={post.id} />
          </div>
        )}
      </article>
    </div>
  );
}
