"use client";

import { ArrowUpRight, MessageSquarePlus } from "lucide-react";
import { useState, useTransition } from "react";
import { submitFeatureRequestAction } from "@/app/actions/feature-request";
import { Modal } from "./Modal";

/** 사이드 배너 모양의 "필요한 기능 요청" 카드. 누르면 요청 창이 열립니다. */
export function FeatureRequestBanner({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const r = await submitFeatureRequestAction(message, contact, window.location.pathname);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setMessage("");
        setContact("");
      }
    });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMsg(null);
          setOpen(true);
        }}
        className={`group relative flex min-h-[104px] w-full flex-col justify-between overflow-hidden rounded-2xl p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-card ${className ?? ""}`}
        style={{ background: "linear-gradient(135deg,#e9f9f3 0%,#c3eedd 100%)" }}
      >
        <MessageSquarePlus
          aria-hidden
          size={92}
          strokeWidth={1.4}
          className="absolute -bottom-3 -right-2 rotate-[-10deg] opacity-[0.18] transition group-hover:scale-110 group-hover:opacity-30"
          style={{ color: "#0e7a63" }}
        />
        <div className="relative">
          <p className="text-[15px] font-extrabold leading-snug tracking-[-0.035em] sm:text-base" style={{ color: "#0e7a63" }}>
            필요한 기능이 있나요?
          </p>
          <p className="mt-1 text-[12.5px] leading-snug" style={{ color: "#3f7f6f" }}>
            있었으면 하는 기능을 알려주세요
          </p>
        </div>
        <ArrowUpRight size={18} aria-hidden className="relative mt-2 self-end opacity-60" style={{ color: "#0e7a63" }} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="필요한 기능을 알려주세요">
        {msg?.ok ? (
          <div>
            <p className="rounded-xl bg-soft p-4 text-[14.5px] text-ink-2">{msg.text}</p>
            <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setOpen(false)}>
              확인
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="feature-message" className="mb-1.5 block text-sm font-semibold text-ink-2">
                어떤 기능이 있으면 좋을까요?
              </label>
              <textarea
                id="feature-message"
                rows={4}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="field resize-none"
                placeholder="불편했던 점이나 있었으면 하는 기능을 자유롭게 적어주세요."
              />
            </div>
            <div>
              <label htmlFor="feature-contact" className="mb-1.5 block text-sm font-semibold text-ink-2">
                연락처 <span className="font-normal text-faint">(선택, 답변이 필요할 때만)</span>
              </label>
              <input id="feature-contact" maxLength={100} value={contact} onChange={(e) => setContact(e.target.value)} className="field" placeholder="이메일 또는 연락 방법" />
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
              <button type="button" className="btn btn-primary flex-1" onClick={submit} disabled={pending}>
                {pending ? "보내는 중…" : "보내기"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
