import Link from "next/link";
import { adminHandleReport } from "../actions";
import { StatusBadge } from "@/components/StatusBadge";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { store } from "@/lib/store";
import type { Report } from "@/lib/types";
import { cn, formatDate, pickFirst, relativeTime } from "@/lib/utils";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS: Array<[Report["status"], string]> = [
  ["open", "처리 대기"],
  ["resolved", "처리 완료"],
  ["rejected", "반려"],
];

export default async function AdminReports({ searchParams }: Props) {
  const raw = pickFirst((await searchParams).status);
  const status: Report["status"] = raw === "resolved" || raw === "rejected" ? raw : "open";
  const reports = await store.listReports(status);

  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        {TABS.map(([v, l]) => (
          <Link key={v} href={`/admin/reports?status=${v}`} className={cn("btn btn-sm", status === v ? "btn-primary" : "btn-outline")}>
            {l}
          </Link>
        ))}
      </div>

      <ul className="space-y-2.5">
        {reports.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[12.5px] font-bold text-brand-dark">{REPORT_REASON_LABELS[r.reason] ?? r.reason}</span>
              <span className="text-xs text-faint">
                {formatDate(r.createdAt)} · {relativeTime(r.createdAt)} · 신고 #{r.id}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {r.post ? (
                <>
                  <StatusBadge status={r.post.status} />
                  <Link href={`/post/${r.post.id}`} className="font-bold hover:text-brand-dark">
                    {r.post.title}
                  </Link>
                </>
              ) : (
                <span className="text-muted">삭제된 글</span>
              )}
            </div>
            {r.detail && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-soft p-3 text-[14px] text-ink-2">{r.detail}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {status === "open" ? (
                <>
                  {r.post && r.post.status === "active" && (
                    <form action={adminHandleReport}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="postId" value={r.postId} />
                      <input type="hidden" name="decision" value="resolve_hide" />
                      <button className="btn btn-primary btn-sm">글 숨기고 처리 완료</button>
                    </form>
                  )}
                  <form action={adminHandleReport}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="resolve" />
                    <button className="btn btn-outline btn-sm">처리 완료</button>
                  </form>
                  <form action={adminHandleReport}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <button className="btn btn-outline btn-sm">반려(문제 없음)</button>
                  </form>
                </>
              ) : (
                <form action={adminHandleReport}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="decision" value="reopen" />
                  <button className="btn btn-outline btn-sm">다시 대기로</button>
                </form>
              )}
              {r.post && (
                <Link href={`/admin/posts?q=${encodeURIComponent(r.post.title)}`} className="btn btn-ghost btn-sm">
                  글 관리로 이동
                </Link>
              )}
            </div>
          </li>
        ))}
        {reports.length === 0 && <li className="rounded-2xl border border-dashed border-line bg-soft/60 py-12 text-center text-muted">신고가 없어요.</li>}
      </ul>
    </div>
  );
}
