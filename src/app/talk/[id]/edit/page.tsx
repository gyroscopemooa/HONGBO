import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMemberPost } from "@/lib/member-community-store";
import { MemberPostForm } from "@/components/MemberPostForm";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "커뮤니티 글 수정",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/talk/${id}/edit`);
  const post = await getMemberPost(Number(id));
  if (!post || post.authorId !== user.id) notFound();
  return (
    <div className="wrap max-w-[800px] py-8">
      <h1 className="mb-5 text-2xl font-black">글 수정</h1>
      <MemberPostForm post={post} />
    </div>
  );
}
