import { requireUser } from "@/lib/auth";
import { MemberPostForm } from "@/components/MemberPostForm";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "회원 커뮤니티 글쓰기",
  robots: { index: false, follow: false },
};
export default async function Page() {
  await requireUser("/talk/write");
  return (
    <div className="wrap max-w-[800px] py-8">
      <h1 className="mb-5 text-2xl font-black">함께 이야기하기</h1>
      <MemberPostForm />
    </div>
  );
}
