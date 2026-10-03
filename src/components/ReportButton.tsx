"use client";

import { Flag } from "lucide-react";
import { useState, useTransition } from "react";
import { reportPostAction } from "@/app/actions/posts";
import { REPORT_REASONS } from "@/lib/constants";
import { Modal } from "./Modal";

export function ReportButton({ postId }: { postId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    if (!reason) {
      setMsg({ ok: false, text: "신고 사유를 선택해주세요." });
      return;
    }
    start(async () => {
      const r = await reportPostAction(postId, reason, detail);
      setMsg({ ok: r.ok, text: r.ok ? (r.message ?? "신고가 접수됐어요.") : r.message });
      if (r.ok) {
        setReason("");
        setDetail("");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMsg(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-brand"
      >
        <Flag size={14} aria-hidden />
        신고하기
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="이 홍보글 신고하기">
        {msg?.ok ? (
          <div>
            <p className="rounded-xl bg-soft p-4 text-[14.5px] text-ink-2">{msg.text}</p>
            <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setOpen(false)}>
              확인
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink-2">신고 사유</legend>
              <div className="grid gap-1.5">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[14px] has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
                  >
                    <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-[#f04f4a]" />
                    {r.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="report-detail" className="mb-1.5 block text-sm font-semibold text-ink-2">
                자세한 내용 <span className="font-normal text-faint">(선택)</span>
              </label>
              <textarea id="report-detail" rows={3} maxLength={500} value={detail} onChange={(e) => setDetail(e.target.value)} className="field resize-none" placeholder="운영자가 확인하는 데 도움이 되는 내용을 적어주세요." />
            </div>
            {msg && !msg.ok && (
              <p role="alert" className="text-sm font-medium text-brand-dark">
                {msg.text}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" className="btn btn-outline flex-1" onClick={() => setOpen(false)}>
                취소
              </button>
              <button type="button" className="btn btn-primary flex-1" disabled={pending} onClick={submit}>
                {pending ? "접수 중…" : "신고하기"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
