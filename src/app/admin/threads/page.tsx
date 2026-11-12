import Link from "next/link";
import { ActionForm } from "./ActionForm";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { formatPromo, hasSensitiveContent } from "../../../../automation/threads/src/index.mjs";
import { moderateThreadsPost, retryThreadsPost, saveThreadsSettings } from "./actions";

export default async function ThreadsAdmin({ searchParams }: { searchParams: Promise<{ excluded?: string }> }) {
  const showExcluded = (await searchParams).excluded === "1";
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
  const visible = candidates.filter(({ consent }) => Boolean(consent?.excluded) === showExcluded);
  return <div className="space-y-4 text-sm">
    <h2 className="text-xl font-bold">Threads 공식 계정 홍보</h2>
    <details className="rounded-lg border px-3 py-2"><summary className="cursor-pointer">운영 안내 · @iamthehongbo</summary>
      <p className="mt-2">10분 간격 · 한국 시간 기준 일일 한도. 자동 검사를 통과한 동의 글은 발행 대상입니다. 원문이 바뀌면 다시 검사합니다. 설정 ON 외에도 별도 Worker 활성화가 필요합니다.</p>
      <p>비허용·목록 삭제는 자동 홍보에서 제외하고 복구 목록으로 이동합니다. 더홍보 원문·이미 발행된 Threads 글·처리 이력은 삭제하지 않습니다. 이미 진행된 게시 요청은 취소되지 않을 수 있습니다.</p>
    </details>
    <ActionForm action={saveThreadsSettings} className="flex flex-wrap gap-4 rounded-xl border p-4">
      <label><input type="checkbox" name="enabled" defaultChecked={settings.data.enabled} /> 자동 홍보 ON</label>
      <label><input type="checkbox" name="use_ai" defaultChecked={settings.data.use_ai} /> AI 문구 선택 ON</label>
      <label>일일 한도 <input className="w-16 border" type="number" name="daily_limit" min="1" max="20" defaultValue={settings.data.daily_limit} required /></label>
      <button className="btn btn-primary" type="submit">설정 저장</button>
    </ActionForm>
    <div className="flex items-center gap-3"><h3 className="font-bold">동의한 글 (최근 50개)</h3>
      <Link className={!showExcluded ? "font-bold underline" : "underline"} href="/admin/threads">검토 목록</Link>
      <Link className={showExcluded ? "font-bold underline" : "underline"} href="/admin/threads?excluded=1">비허용·삭제 목록 / 복구</Link>
    </div>
    <p className="text-xs text-gray-500">‘검토 승인’은 원문·링크 미리보기에 재게시하면 안 되는 개인정보·민감정보가 없음을 확인하고 자동 홍보를 허용하는 버튼입니다.</p>
    <div className="divide-y rounded-lg border">
    {visible.length === 0 && <p className="p-3 text-gray-500">해당 목록에 글이 없습니다.</p>}
    {visible.map(({ post, hash, consent }) => {
      const source = { post_id: post.id, title: post.title, short_description: post.short_description, description: post.description, published_at: post.published_at, external_url: post.external_url };
      const blocked = hasSensitiveContent(source);
      return <article key={post.id} className="relative px-3 py-2">
        <div className="mr-14 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <span className="text-xs text-gray-500">#{post.id}</span>
          <Link className="min-w-20 flex-1 truncate underline" title={post.title} href={`/post/${post.id}`}>{post.title}</Link>
          <span className="text-xs">{consent?.excluded ? "비허용" : blocked ? "차단" : hash && consent?.approved_hash === hash ? "승인" : "검토 필요"}</span>
          {hash && <ActionForm action={moderateThreadsPost} className="flex items-center gap-2 text-xs">
            <input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="hash" value={hash} />
            <button className="rounded border px-2 py-1 disabled:opacity-40" name="decision" value="reviewed_approve" disabled={blocked}>{showExcluded ? "검토 후 복구·승인" : "검토 승인"}</button>
            {!showExcluded && <><button className="rounded border px-2 py-1" name="decision" value="exclude">비허용</button>
            <button className="rounded border px-2 py-1 text-red-700" name="decision" value="exclude" title="자동 홍보에서 제외하고 복구 가능한 삭제 목록으로 이동합니다. 원문과 게시 이력은 보존됩니다.">목록 삭제</button></>}
          </ActionForm>}
        </div>
        <details className="text-xs"><summary className="absolute right-3 top-3 cursor-pointer text-gray-500" title="원문 / 발행 미리보기">상세</summary>
          <p className="mt-2">원문 상태: {post.status}</p>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify({ title: post.title, short_description: post.short_description, description: post.description, contact: post.contact, address: post.address, extra: post.extra, external_url: post.external_url }, null, 2)}</pre>
          {blocked ? <p className="text-red-700">개인정보 또는 민감정보 패턴 감지: 발행 차단</p> : <pre className="mt-2 whitespace-pre-wrap break-words">{formatPromo(source, "https://www.thehongbo.com")}</pre>}
        </details>
      </article>;
    })}
    </div>
    <h3 className="font-bold">최근 처리 내역 (50개)</h3>
    {(jobs.data ?? []).map(job => <article key={job.post_id} className="relative rounded-lg border px-3 py-2">
      <div className="mr-14 flex items-center gap-3 overflow-x-auto whitespace-nowrap"><Link href={`/post/${job.post_id}`} className="underline">원문 #{job.post_id}</Link>
      <p>{job.status} · 시도 {job.attempts}회 · {job.claimed_at}</p></div>
      <details className="text-xs"><summary className="absolute right-3 top-3 cursor-pointer text-gray-500" title="처리 결과">상세</summary>
      {job.error_message && <p>{job.error_message}</p>}
      {job.threads_url && /^https:\/\/(www\.)?threads\.(net|com)\//.test(job.threads_url) && <a className="underline" href={job.threads_url} target="_blank" rel="noreferrer">Threads 게시글</a>}
      {job.threads_id && <p>Threads ID: {job.threads_id}</p>}
      {job.draft_text && <pre className="whitespace-pre-wrap break-words">{job.draft_text}</pre>}
      {job.lease && !job.publish_started_at && !job.threads_id && ["retry", "review", "blocked"].includes(job.status) && <ActionForm action={retryThreadsPost}><input type="hidden" name="post_id" value={job.post_id} /><button className="btn btn-outline">안전한 단계부터 재시도 예약</button></ActionForm>}
      {job.status === "review" && job.publish_started_at && <p>게시 결과가 불확실합니다. 공식 계정에서 직접 대조해야 하며 자동·수동 재전송은 잠겨 있습니다.</p>}
      </details>
    </article>)}
  </div>;
}
