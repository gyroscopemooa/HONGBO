"use client";
import { useActionState } from "react";
import { saveCommunityAction } from "@/app/admin/community/actions";
import { COMMUNITY_TOPICS, type CommunityPost } from "@/lib/community";

export function CommunityForm({ post }: { post?: CommunityPost }) {
  const [state, action, pending] = useActionState(saveCommunityAction, { error: "" });
  const fields = [
    ["title", "구체적인 제목", 120, 1, "누가 어떤 상황에서 겪는 문제인가요?"],
    ["question", "이 글이 해결하는 질문 하나", 200, 2, "기존 글과 겹치지 않는 질문을 적어 주세요."],
    ["answer", "첫 문단의 답", 2000, 4, "해결 방법이나 핵심 결론부터 알려주세요."],
    ["steps", "따라 할 수 있는 방법", 20000, 12, "준비 조건과 실행 순서를 적어 주세요. 줄바꿈을 유지하는 일반 텍스트입니다."],
    ["limitations", "안 되는 경우와 대안", 5000, 4, "기기·브라우저·권한 등의 제약과 대안을 설명해 주세요."],
    ["verification", "추가 확인이 필요한 사실 (관리자에게만 표시)", 5000, 3, "미확인 기능, 출처 확인, 발행 후 보완할 사항"],
  ] as const;
  return <form action={action} className="space-y-5">
    {post && <input type="hidden" name="id" value={post.id} />}
    <p className="rounded-xl bg-brand-soft p-4 text-sm leading-6">링크를 누르지 않아도 해결 방법을 알 수 있게 작성해 주세요. 확인하지 않은 검색량·기능·사용 후기는 넣지 않습니다. 같은 질문의 글이 있다면 기존 글을 보완하세요.</p>
    <label className="block font-semibold">주제<select name="topic" defaultValue={post?.topic ?? "promotion"} className="field mt-2">{Object.entries(COMMUNITY_TOPICS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    {fields.map(([name, label, max, rows, placeholder]) => <label key={name} className="block font-semibold">{label}<textarea name={name} required={name !== "verification"} maxLength={max} rows={rows} defaultValue={post?.[name] ?? ""} placeholder={placeholder} className="field mt-2 resize-y font-normal" /></label>)}
    <label className="block font-semibold">관련 안내 링크<textarea name="links" rows={4} defaultValue={post?.links.map(l => `${l.label} | ${l.url}`).join("\n")} placeholder={"한 줄에 하나, 최대 8개: 목적을 설명하는 문구 | /community/글-ID"} className="field mt-2 font-normal" /></label>
    <fieldset className="space-y-3 rounded-xl border border-line p-4"><legend className="px-2 font-bold">서비스 연결 (선택)</legend>
      <label className="block text-sm">링크 문구<input name="serviceLabel" maxLength={100} defaultValue={post?.service?.label} placeholder="더홍보에 홍보글 등록하기" className="field mt-1" /></label>
      <label className="block text-sm">연결 주소<input name="serviceUrl" maxLength={2000} defaultValue={post?.service?.url} placeholder="/write" className="field mt-1" /></label>
    </fieldset>
    <label className="block font-semibold">공개 상태<select name="status" defaultValue={post?.status ?? "draft"} className="field mt-2"><option value="draft">초안 · 비공개</option><option value="published">공개</option></select></label>
    <p className="text-sm text-muted">공개한 글도 초안으로 변경하면 목록과 상세 페이지에서 숨겨집니다. 글 주소는 수정해도 유지됩니다.</p>
    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    <button disabled={pending} className="btn btn-primary disabled:opacity-50">{pending ? "저장 중…" : "글 저장"}</button>
  </form>;
}
