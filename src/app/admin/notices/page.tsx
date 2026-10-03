import { adminDeleteNotice, adminSaveNotice } from "../actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { store } from "@/lib/store";
import type { Notice } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function NoticeForm({ n }: { n?: Notice }) {
  return (
    <form action={adminSaveNotice} className="space-y-3">
      {n && <input type="hidden" name="id" value={n.id} />}
      <label className="block text-xs font-semibold text-muted">
        제목
        <input name="title" required maxLength={100} defaultValue={n?.title} className="field mt-1 !py-2" />
      </label>
      <label className="block text-xs font-semibold text-muted">
        내용
        <textarea name="body" rows={3} maxLength={3000} defaultValue={n?.body} className="field mt-1 resize-y !py-2" />
      </label>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm font-medium text-ink-2">
          <input type="checkbox" name="isPinned" defaultChecked={n?.isPinned} className="accent-[#f04f4a]" /> 상단 고정
        </label>
        <button className="btn btn-primary btn-sm">{n ? "저장" : "공지 등록"}</button>
      </div>
    </form>
  );
}

export default async function AdminNotices() {
  const notices = await store.listNotices();
  return (
    <div className="space-y-4">
      {notices.map((n) => (
        <section key={n.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="mb-2 text-xs text-faint">
            #{n.id} · {formatDate(n.publishedAt)}
            {n.isPinned && " · 상단 고정"}
          </p>
          <NoticeForm n={n} />
          <form action={adminDeleteNotice} className="mt-2 text-right">
            <input type="hidden" name="id" value={n.id} />
            <ConfirmButton message="이 공지를 삭제할까요?">공지 삭제</ConfirmButton>
          </form>
        </section>
      ))}
      <section className="rounded-2xl border border-dashed border-[#c9ced9] bg-soft/50 p-4">
        <h2 className="mb-3 font-extrabold">새 공지 작성</h2>
        <NoticeForm />
      </section>
    </div>
  );
}
