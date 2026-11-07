import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { getAdminClient } from "@/lib/supabase/admin";
import { setThreadsConsent } from "@/lib/threads-consent";

export const metadata = { title: "공식 Threads 홍보 동의", robots: { index: false, follow: false } };
export default async function ThreadsConsent({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  if (!/^\d{1,12}$/.test(raw)) notFound();
  const id = Number(raw);
  const user = await requireUser(`/post/${id}/threads`);
  const post = await store.getPost(id);
  if (!post || post.authorId !== user.id || post.isSeed || post.status === "deleted") notFound();
  const { data, error } = await getAdminClient().from("threads_promotion_permissions").select("consent_at,approved_hash,excluded").eq("post_id", id).maybeSingle();
  if (error) return <p className="wrap py-8">공식 SNS 홍보 동의 기능을 준비 중입니다. 기존 글에는 동의가 자동 적용되지 않습니다.</p>;
  async function saveConsent(form: FormData) {
    "use server";
    const actor = await requireUser(`/post/${id}/threads`);
    if (actor.status === "blocked") throw new Error("이 계정에서는 변경할 수 없습니다.");
    await setThreadsConsent(id, actor.id, form.get("consent") === "on");
    revalidatePath(`/post/${id}/threads`);
  }
  return <div className="wrap space-y-5 py-8">
    <h1 className="text-xl font-bold">공식 Threads 홍보 동의</h1><p>{post.title}</p>
    <p>선택 동의입니다. 동의하지 않아도 더홍보의 글 등록과 이용에는 영향이 없습니다.</p>
    <p>동의하면 이 글의 제목, 소개·본문 일부와 원문 링크를 더홍보 공식 Threads 계정 @iamthehongbo에서 공개 홍보할 수 있습니다. 원문에 없는 혜택을 만들지 않으며 더홍보 소개와 가벼운 홍보 문구가 덧붙습니다.</p>
    <p>자동 검사에 통과한 글은 별도 관리자 승인 없이 발행 대상이 됩니다. 개인정보·민감정보가 의심되거나 연락처·주소·첨부 이미지 등 확인이 필요한 글은 관리자 검토로 보류합니다. 현재 문구 작성에 외부 유료 AI를 사용하지 않습니다. 발행 한도·등록 시각·운영 상태에 따라 실제 발행되지 않을 수 있습니다.</p>
    <p>링크 미리보기가 표시될 수 있으며, 홍보 문구와 관련 주제 태그가 덧붙을 수 있습니다. 자세한 기준은 <a href="/policy#threads" className="underline">공식 SNS 홍보 운영정책</a>에서 확인해주세요.</p>
    {data?.consent_at && <p>동의 저장됨 · {data.excluded ? "운영자 제외" : data.approved_hash ? "검사 또는 검토 통과 (최종 원문 재확인 후 발행)" : "검토 대기"}</p>}
    <p>동의는 이 화면에서 철회할 수 있습니다. 철회 이후 발행 전 확인에서 제외되지만 이미 발행 요청이 시작됐거나 Threads에 게시·공유된 내용은 자동 삭제되지 않습니다. 기존 게시물 삭제가 필요하면 문의하기로 요청해주세요.</p>
    <form action={saveConsent} className="space-y-4"><label className="block"><input type="checkbox" name="consent" defaultChecked={!!data?.consent_at} /> [선택] 위 내용을 읽고 이 글의 공식 Threads 홍보에 동의합니다.</label><button className="btn btn-primary">동의 상태 저장</button></form>
  </div>;
}
