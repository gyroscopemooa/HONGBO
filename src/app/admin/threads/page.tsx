import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { formatPromo, hasSensitiveContent } from "../../../../automation/threads/src/index.mjs";
import { moderateThreadsPost, retryThreadsPost, saveThreadsSettings } from "./actions";

export default async function ThreadsAdmin() {
  await requireAdmin();
  const db = getAdminClient();
  const [settings, jobs, permissions] = await Promise.all([
    db.from("threads_promotion_settings").select("*").eq("id", true).single(),
    db.from("threads_promotion_jobs").select("*").order("claimed_at", { ascending: false }).limit(50),
    db.from("threads_promotion_permissions").select("*").not("consent_at", "is", null).order("consent_at", { ascending: false }).limit(50),
  ]);
  if (settings.error || jobs.error || permissions.error) return <p>Threads 저장소가 준비되지 않았습니다. 검토된 SQL 0001 → 0002를 적용한 뒤 확인해주세요. 자동 발행은 아직 사용할 수 없습니다.</p>;
  const ids = (permissions.data ?? []).map(c => c.post_id);
  const posts = ids.length ? await db.from("posts").select("*").in("id", ids) : { data: [], error: null };
  if (posts.error) return <p>원문을 불러오지 못했습니다.</p>;
  const candidates = await Promise.all((posts.data ?? []).map(async post => {
    const hash = await db.rpc("threads_source_hash", { p: post });
    return { post, hash: hash.error ? null : hash.data, consent: permissions.data?.find(c => c.post_id === post.id) };
  }));
  return <div className="space-y-6">
    <h2 className="text-xl font-bold">Threads 공식 계정 홍보</h2>
    <p>대상 계정: @iamthehongbo · 10분 간격 · 한국 시간 기준 일일 한도. 새 동의 절차에서 자동 검사를 통과한 글은 바로 발행 대상이 됩니다. 개인정보 의심 내용·첨부 이미지 등 검토 대기 글만 직접 확인해주세요. 수정된 원문도 다시 검사합니다.</p>
    <p>운영 활성화는 최종 승인 후 별도 Worker 설정도 켜야 합니다. 아래 ON만으로 배포 설정의 OFF가 해제되지 않습니다.</p>
    <form action={saveThreadsSettings} className="flex flex-wrap gap-4 rounded-xl border p-4">
      <label><input type="checkbox" name="enabled" defaultChecked={settings.data.enabled} /> 자동 홍보 ON</label>
      <label><input type="checkbox" name="use_ai" defaultChecked={settings.data.use_ai} /> AI 문구 선택 ON</label>
      <label>일일 한도 <input className="w-16 border" type="number" name="daily_limit" min="1" max="20" defaultValue={settings.data.daily_limit} required /></label>
      <button className="btn btn-primary" type="submit">설정 저장</button>
    </form>
    <h3 className="font-bold">동의한 글 검토 · 템플릿 미리보기 (최근 50개)</h3>
    {candidates.map(({ post, hash, consent }) => {
      const source = { post_id: post.id, title: post.title, short_description: post.short_description, description: post.description };
      const blocked = hasSensitiveContent(source);
      return <article key={post.id} className="space-y-3 rounded-xl border p-4">
        <Link className="underline" href={`/post/${post.id}`}>{post.title}</Link>
        <p>상태: {post.status} · {consent?.excluded ? "제외" : consent?.approved_hash === hash ? consent.approved_by ? "관리자 검토 승인" : "자동 검사 통과" : "검토 필요"}</p>
        <details><summary>검토할 원문 전체와 부가 정보</summary><pre className="whitespace-pre-wrap break-all">{JSON.stringify({ title: post.title, short_description: post.short_description, description: post.description, contact: post.contact, address: post.address, extra: post.extra, external_url: post.external_url }, null, 2)}</pre></details>
        {blocked ? <p>개인정보 또는 민감정보 패턴 감지: 발행 차단</p> : <pre className="whitespace-pre-wrap">{formatPromo(source, "https://www.thehongbo.com")}</pre>}
        {hash && <form action={moderateThreadsPost} className="flex flex-wrap gap-3">
          <input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="hash" value={hash} />
          <label><input type="checkbox" name="reviewed" /> 원문 전체와 링크 미리보기에 재게시하면 안 되는 개인정보·민감정보가 없음을 확인했습니다.</label>
          <button className="btn btn-outline" name="decision" value="approve" disabled={blocked}>검토 승인</button>
          <button className="btn btn-outline" name="decision" value="exclude">자동 홍보 제외</button>
        </form>}
      </article>;
    })}
    <h3 className="font-bold">최근 처리 내역 (50개)</h3>
    {(jobs.data ?? []).map(job => <article key={job.post_id} className="space-y-2 rounded-xl border p-4">
      <Link href={`/post/${job.post_id}`} className="underline">원문 #{job.post_id}</Link>
      <p>{job.status} · 시도 {job.attempts}회 · {job.claimed_at} · {job.error_message}</p>
      {job.threads_url && /^https:\/\/(www\.)?threads\.(net|com)\//.test(job.threads_url) && <a className="underline" href={job.threads_url} target="_blank" rel="noreferrer">Threads 게시글</a>}
      {job.threads_id && <p>Threads ID: {job.threads_id}</p>}
      {job.draft_text && <pre className="whitespace-pre-wrap">{job.draft_text}</pre>}
      {job.lease && !job.publish_started_at && !job.threads_id && ["retry", "review", "blocked"].includes(job.status) && <form action={retryThreadsPost}><input type="hidden" name="post_id" value={job.post_id} /><button className="btn btn-outline">안전한 단계부터 재시도 예약</button></form>}
      {job.status === "review" && job.publish_started_at && <p>게시 결과가 불확실합니다. 공식 계정에서 직접 대조해야 하며 자동·수동 재전송은 잠겨 있습니다.</p>}
    </article>)}
  </div>;
}
