import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getMemberPost,
  listMemberComments,
  listMemberApplications,
} from "@/lib/member-community-store";
import {
  MEMBER_CATEGORIES,
  MEMBER_PURPOSES,
  MEMBER_POLICY,
} from "@/lib/member-community";
import {
  MemberApplications,
  MemberComments,
  MemberPostControls,
  MemberReport,
} from "@/components/MemberInteractions";
export const dynamic = "force-dynamic";
export const metadata = { title: "회원 커뮤니티 이야기" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ applicationsPage?: string }>;
}) {
  const { id } = await params;
  const applicationParams = await searchParams;
  const applicationsPage = Math.max(
    1,
    Math.min(10000, Number(applicationParams.applicationsPage) || 1),
  );
  const post = await getMemberPost(Number(id));
  if (!post) notFound();
  const [comments, user] = await Promise.all([
    listMemberComments(post.id),
    getCurrentUser(),
  ]);
  const applications = user
    ? await listMemberApplications(
        post.id,
        user.id,
        user.id === post.authorId || user.isAdmin,
        applicationsPage,
      )
    : [];
  const d = post.details;
  const fields = [
    ["플랫폼", d.platform],
    ["지역", d.location],
    ["모집 인원", d.count ? `${d.count}명` : null],
    ["기간", [d.startDate, d.endDate].filter(Boolean).join(" ~ ")],
    ["혜택·조건", d.reward],
    ["참여 방법", d.application],
  ];
  return (
    <div className="wrap max-w-[800px] py-8">
      <Link className="text-sm text-brand" href="/talk">
        ← 회원 커뮤니티
      </Link>
      <article className="mt-5">
        <p className="text-sm text-muted">
          {MEMBER_CATEGORIES.find((x) => x.value === post.category)?.label} ·{" "}
          {MEMBER_PURPOSES.find((x) => x.value === post.purpose)?.label}
          {post.closed ? " · 모집 마감" : ""}
        </p>
        <h1 className="mt-2 break-words text-2xl font-black">{post.title}</h1>
        <p className="my-3 text-sm text-muted">
          {post.nickname} ·{" "}
          {new Date(post.createdAt).toLocaleDateString("ko-KR", {
            timeZone: "Asia/Seoul",
          })}
        </p>
        <div className="whitespace-pre-wrap break-words py-5 leading-relaxed">
          {post.body}
        </div>
        <dl className="space-y-3 rounded-xl bg-soft p-4">
          {fields
            .filter(([, v]) => !!v)
            .map(([k, v]) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[100px_1fr]">
                <dt className="font-bold">{k}</dt>
                <dd className="whitespace-pre-wrap break-words">{v}</dd>
              </div>
            ))}
          {d.link && (
            <div>
              <dt className="font-bold">관련 링크</dt>
              <dd>
                <a
                  className="break-all text-brand underline"
                  href={d.link}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                >
                  {d.link} (새 창)
                </a>
              </dd>
            </div>
          )}
          {d.promotionId && (
            <div>
              <dt className="font-bold">기존 홍보</dt>
              <dd>
                <Link
                  className="text-brand underline"
                  href={`/post/${d.promotionId}`}
                >
                  홍보글 보기
                </Link>
              </dd>
            </div>
          )}
        </dl>
        <p className="my-4 text-xs text-muted">{MEMBER_POLICY}</p>
        <MemberPostControls
          id={post.id}
          closed={post.closed}
          owner={user?.id === post.authorId}
          admin={!!user?.isAdmin}
        />
        <div className="mt-3">
          <MemberReport postId={post.id} />
        </div>
      </article>
      {(post.details.acceptApplications || applications.length > 0) && (
        <MemberApplications
          postId={post.id}
          closed={post.closed}
          owner={user?.id === post.authorId || !!user?.isAdmin}
          userId={user?.id}
          applications={applications}
        />
      )}
      {(user?.id === post.authorId || user?.isAdmin) && (
        <nav className="my-3 flex gap-3">
          {applicationsPage > 1 && (
            <Link
              href={`/talk/${post.id}?applicationsPage=${applicationsPage - 1}`}
            >
              이전 신청
            </Link>
          )}
          {applications.length === 100 && (
            <Link
              href={`/talk/${post.id}?applicationsPage=${applicationsPage + 1}`}
            >
              다음 신청
            </Link>
          )}
        </nav>
      )}
      <MemberComments
        postId={post.id}
        comments={comments}
        userId={user?.id}
        isAdmin={!!user?.isAdmin}
      />
    </div>
  );
}
