import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { getAppeal, APPEAL_STATES, DEFAULT_MODERATION_REASON } from "@/lib/post-appeals";
import { submitAppeal } from "../actions";
export const metadata = { title: "홍보글 이의제기", robots: { index: false, follow: false } };
export default async function AppealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  if (!/^\d{1,12}$/.test(raw)) notFound();
  const id = Number(raw);
  const user = await requireUser(`/appeals/${id}`);
  const post = await store.getPost(id);
  if (!post || post.authorId !== user.id || post.status === "deleted") notFound();
  const item = await getAppeal(id);
  const restricted = ["hidden", "blocked"].includes(post.status);
  const secondStage = ["pdf_requested", "rejected"].includes(item?.state ?? "");
  return <div className="wrap max-w-3xl space-y-5 py-8">
    <h1 className="text-2xl font-bold">홍보글 이의제기</h1><p>{post.title}</p>
    <section className="rounded-xl border border-line p-4"><h2 className="font-bold">숨김·차단 사유</h2><p className="whitespace-pre-wrap">{item?.reason || DEFAULT_MODERATION_REASON}</p></section>
    <p className="font-semibold">{!restricted ? "현재 공개 가능 상태입니다." : APPEAL_STATES[item?.state ?? "restricted"]}</p>
    {restricted && <section className="rounded-xl bg-soft p-4"><h2 className="font-bold">정책에 맞는 홍보 방법</h2><p>먼저 안내된 사유에 맞게 내용을 보완하고 복원 검토를 요청해주세요. 운영정책을 충족하고 게시 제한이 해제된 뒤에는 실제로 제공 가능한 무료·할인·증정 등 혜택 이벤트를 진행하거나 <Link className="underline" href="/advertise">유료 광고 기능</Link>을 활용해 홍보해주세요. 이벤트 진행이나 유료 광고 이용으로 숨김·차단이 해제되지는 않으며, 모든 홍보에는 동일한 <Link className="underline" href="/policy">운영정책</Link>이 적용됩니다.</p></section>}
    {item?.response && <section className="rounded-xl bg-soft p-4"><h2 className="font-bold">관리자 안내</h2><p className="whitespace-pre-wrap">{item.response}</p></section>}
    {secondStage && <p><Link className="btn btn-primary" href={`/restoration?post=${id}`}>복원 신청하기</Link></p>}
    {restricted && !secondStage && <p>먼저 <Link className="underline" href={`/post/${id}/edit`}>홍보글을 수정</Link>한 뒤 바꾼 내용과 복원 요청 사유를 작성해주세요. 계정 제한으로 수정할 수 없다면 아래에 수정 원고를 함께 적어주세요. 수정이나 신청만으로 글이 공개되지는 않습니다.</p>}
    {restricted && !secondStage && item?.state !== "pending" && <form action={submitAppeal} className="space-y-3">
      <input type="hidden" name="id" value={id}/><input type="hidden" name="version" value={item?.version ?? 0}/>
      <label className="block font-semibold" htmlFor="appeal-text">수정 내용 및 이의제기 사유 · 30~5,000자</label>
      <textarea id="appeal-text" name="text" className="field min-h-48" minLength={30} maxLength={5000} required placeholder="어떤 내용을 어떻게 보완했는지, 확인 가능한 주소와 복원을 요청하는 이유를 적어주세요. 2차 자료를 이메일로 보냈다면 발송 일시와 제목도 적어주세요."/>
      <button className="btn btn-primary">이의제기 및 복원 검토 요청</button>
    </form>}
    {item?.appeal && <section><h2 className="font-bold">최근 제출 내용</h2><p className="whitespace-pre-wrap">{item.appeal}</p></section>}
    {item && <details><summary>처리 이력 보기</summary><ul className="space-y-3">{item.events.map((event, i) => <li key={i}><time>{event.at}</time><p className="whitespace-pre-wrap">{event.text}</p></li>)}</ul></details>}
    <Link href="/mypage" className="underline">내 홍보로 돌아가기</Link>
  </div>;
}
