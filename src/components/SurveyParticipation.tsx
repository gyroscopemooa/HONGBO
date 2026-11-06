"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ClipboardList, LoaderCircle } from "lucide-react";
import { submitSurveyAction } from "@/app/actions/survey";
import type { SurveyQuestion } from "@/lib/types";

export function SurveyParticipation({ postId, questions }: { postId: number; questions: SurveyQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setFeedback(null);
  };

  return (
    <section id="hongbo-survey" aria-labelledby="hongbo-survey-title" className="mt-7 scroll-mt-24 rounded-2xl border border-[#edcc7d] bg-white p-5 shadow-card sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <ClipboardList className="mt-0.5 shrink-0 text-[#b77b09]" size={24} aria-hidden />
        <div>
          <h2 id="hongbo-survey-title" className="text-[19px] font-black tracking-[-0.04em]">더홍보 전용 설문</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">이 페이지에서 직접 참여하세요. 동일 브라우저에서는 한 번만 제출할 수 있습니다. 응답은 홍보글 작성자와 관리자만 볼 수 있어요.</p>
        </div>
      </div>
      {feedback?.ok ? (
        <div role="status" className="flex items-center gap-2 rounded-xl bg-[#eef9ef] p-4 text-[14px] font-bold text-[#20723b]">
          <CheckCircle2 size={19} aria-hidden /> {feedback.message}
        </div>
      ) : (
        <form method="post" onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          startTransition(async () => setFeedback(await submitSurveyAction(postId, answers)));
        }} className="space-y-5">
          {questions.map((q, index) => (
            <fieldset key={q.id} className="space-y-2.5">
              <legend className="text-[14px] font-bold text-ink">
                {index + 1}. {q.title}
                {q.required ? <span className="ml-1 text-brand-dark" aria-label="필수">*</span> : <span className="ml-1 text-xs font-normal text-muted">(선택)</span>}
              </legend>
              {q.type === "choice" ? (
                <div className="grid gap-2">
                  {(q.options ?? []).map((option) => (
                    <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-3 text-[14px] hover:border-[#dab96a]">
                      <input type="radio" name={`survey-${q.id}`} value={option} checked={answers[q.id] === option} required={q.required} onChange={() => setAnswer(q.id, option)} className="accent-[#bd870c]" />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea className="field min-h-[86px] resize-y" maxLength={500} required={q.required} value={answers[q.id] ?? ""} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder="답변을 입력해주세요. (최대 500자)" />
              )}
            </fieldset>
          ))}
          {feedback && !feedback.ok && <p role="alert" className="text-[13px] font-semibold text-brand-dark">{feedback.message}</p>}
          <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
            {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
            {pending ? "제출 중…" : "설문 제출하기"}
          </button>
        </form>
      )}
    </section>
  );
}
