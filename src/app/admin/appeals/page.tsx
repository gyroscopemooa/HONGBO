import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { APPEAL_STATES, type Appeal } from "@/lib/post-appeals";
import { reviewAppeal } from "@/app/appeals/actions";
export default async function AdminAppeals() {
  await requireAdmin();
  const { data, error } = await getAdminClient().from("post_appeals").select("*,posts(title,status,updated_at)").in("state", ["pending", "pdf_requested", "rejected"]).order("updated_at", { ascending: true }).limit(100);
  if (error) return <p>이의제기 저장소가 준비되지 않았습니다. 마이그레이션 0012 적용 여부를 확인해주세요.</p>;
  return <div className="space-y-5"><h1 className="text-2xl font-bold">이의제기 검토</h1><p>접수 순으로 최대 100건을 표시합니다. 2차 자료 요청 후에는 지원 메일에서 PDF를 확인하고 승인해주세요. 만료된 글은 복원 후에도 노출 기간을 별도로 갱신해야 합니다. 계정 차단은 사용자 관리에서 별도로 해제합니다.</p>
    {(data ?? []).map(raw => { const a = raw as Appeal & { posts: { title: string; status: string; updated_at: string } }; return <article key={a.post_id} className="space-y-3 rounded-xl border border-line p-4">
      <h2 className="font-bold"><Link href={`/post/${a.post_id}`}>#{a.post_id} {a.posts.title}</Link> · {APPEAL_STATES[a.state]}</h2>
      <p className="whitespace-pre-wrap">처음 조치 사유: {a.reason}</p><p className="whitespace-pre-wrap">이의제기 내용: {a.appeal}</p><p className="whitespace-pre-wrap">최근 관리자 안내: {a.response}</p>
      <details><summary>전체 처리 이력</summary>{a.events.map((e,i)=><p key={i} className="whitespace-pre-wrap">{e.at} · {e.action}: {e.text}</p>)}</details>
      <form action={reviewAppeal} className="space-y-2"><input type="hidden" name="id" value={a.post_id}/><input type="hidden" name="version" value={a.version}/><input type="hidden" name="sourceUpdated" value={a.posts.updated_at}/>
        <label className="block">작성자에게 보낼 안내<textarea name="text" maxLength={2000} className="field" placeholder="추가로 보완하거나 사실 확인해야 할 내용을 구체적으로 입력하세요. 비워두면 선택한 처리의 기본 안내가 전달됩니다."/></label>
        <div className="flex flex-wrap gap-2"><button name="decision" value="approve" className="btn btn-primary">복원 승인</button><button name="decision" value="revision" className="btn btn-outline">추가 보완 요청</button><button name="decision" value="pdf_requested" className="btn btn-outline">2차 PDF 제출 안내</button><button name="decision" value="reject" className="btn btn-outline">복원 불가 안내</button></div>
      </form>
    </article>; })}
    {!data?.length && <p>검토할 이의제기가 없습니다.</p>}
  </div>;
}
