"use client";

import { Flag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteReviewAction, reportReviewAction } from "@/app/actions/reviews";
import { REVIEW_REPORT_REASONS } from "@/lib/reviews";

export function ReviewDeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("이 후기를 삭제할까요?")) return;
          start(async () => {
            const r = await deleteReviewAction(id);
            if (r.ok) {
              router.push("/reviews");
              router.refresh();
            } else setError(r.message);
          });
        }}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-brand"
      >
        <Trash2 size={14} aria-hidden /> 삭제
      </button>
      {error && <span className="text-xs text-brand-dark">{error}</span>}
    </span>
  );
}

export function ReviewReportButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (msg?.ok) return <span className="text-[13px] font-medium text-[#20723b]">{msg.text}</span>;
  return (
    <div className="inline-block">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-brand">
        <Flag size={14} aria-hidden /> 신고
      </button>
      {open && (
        <div className="mt-2 w-[min(320px,100%)] space-y-2 rounded-xl border border-line bg-white p-3 shadow-card">
          <select aria-label="신고 사유" value={reason} onChange={(e) => setReason(e.target.value)} className="field">
            <option value="">신고 사유를 선택해주세요</option>
            {Object.entries(REVIEW_REPORT_REASONS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <textarea aria-label="신고 내용" value={detail} maxLength={500} onChange={(e) => setDetail(e.target.value)} rows={3} className="field resize-y" placeholder="자세한 내용을 적어주세요 (선택)" />
          {msg && !msg.ok && <p role="alert" className="text-xs text-brand-dark">{msg.text}</p>}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await reportReviewAction(id, reason, detail);
                setMsg({ ok: r.ok, text: r.ok ? (r.message ?? "신고가 접수됐어요.") : r.message });
              })
            }
            className="btn btn-primary w-full"
          >
            {pending ? "접수 중…" : "신고하기"}
          </button>
        </div>
      )}
    </div>
  );
}
