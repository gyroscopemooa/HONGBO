import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { ActionForm } from "../threads/ActionForm";
import { saveAutoComments } from "./actions";
export default async function AutoCommentsAdmin() {
  await requireAdmin();
  const db = getAdminClient();
  const [settings, jobs] = await Promise.all([
    db.from("auto_comment_settings").select("*").eq("id", true).single(),
    db.from("auto_comment_attempts").select("*").order("claimed_at", { ascending: false }).limit(50),
  ]);
  if (settings.error || jobs.error) return <p>자동 댓글 저장소가 아직 준비되지 않았습니다. 0015 마이그레이션 적용 후 사용할 수 있습니다.</p>;
  return <section className="space-y-4"><h2 className="text-xl font-bold">자동 댓글</h2>
    <p className="text-sm">신규 공개 글에 약 10분 후 홍보회원 2455로 질문·제안을 남깁니다. Worker 연결 및 무료 요금제 확인이 별도로 필요합니다. 과거 글은 처리하지 않습니다.</p>
    <ActionForm action={saveAutoComments}>
      <label><input type="checkbox" name="enabled" defaultChecked={settings.data.enabled} /> 사용</label>
      <label> 일일 생성 시도 한도 <input className="input" type="number" name="daily_limit" min="1" max="50" defaultValue={settings.data.daily_limit} /></label>
      <button className="btn btn-primary" type="submit">저장</button>
    </ActionForm>
    <p className="text-sm">사용을 끄면 진행 중인 댓글도 등록하지 않습니다. 댓글 삭제는 해당 글에서 관리자 삭제 버튼으로 처리합니다.</p>
    <ul className="divide-y">{jobs.data.map(job => <li key={job.post_id} className="py-2 text-sm"><Link href={`/post/${job.post_id}`}>글 #{job.post_id}</Link> · {job.status} · {job.claimed_at}</li>)}</ul>
  </section>;
}
