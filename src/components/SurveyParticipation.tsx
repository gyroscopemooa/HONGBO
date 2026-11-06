"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ClipboardList, LoaderCircle } from "lucide-react";
import { submitSurveyAction } from "@/app/actions/survey";
import { SURVEY_OTHER_LABEL, SURVEY_OTHER_MAX, SURVEY_OTHER_PREFIX } from "@/lib/constants";
import type { SurveyPayout, SurveyQuestion } from "@/lib/types";

export function SurveyParticipation({ postId, questions, payout }: { postId: number; questions: SurveyQuestion[]; payout?: SurveyPayout }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState("");
  const [agree, setAgree] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string; reward?: { text?: string; url?: string } } | null>(null);
  const [pending, startTransition] = useTransition();

  const isOther = (v?: string) => v !== undefined && v.startsWith(SURVEY_OTHER_PREFIX);
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
        <div role="status" className="rounded-xl bg-[#eef9ef] p-4 text-[14px] font-bold text-[#20723b]">
          <p className="flex items-center gap-2"><CheckCircle2 size={19} aria-hidden /> {feedback.message}</p>
          {feedback.reward && (
            <div className="mt-3 rounded-lg bg-white p-3 text-[13.5px] font-semibold text-ink">
              {feedback.reward.text && <p className="select-all whitespace-pre-wrap break-words">{feedback.reward.text}</p>}
              {feedback.reward.url && (
                <a href={feedback.reward.url} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-primary mt-2 w-full">혜택 링크 열기</a>
              )}
              <p className="mt-2 text-xs font-normal text-muted">이 화면을 닫으면 다시 볼 수 없으니 지금 확인해 두세요.</p>
            </div>
          )}
          {payout === "draw" && <p className="mt-2 text-xs font-normal text-muted">당첨 시 입력하신 연락처로 업체가 직접 안내합니다.</p>}
        </div>
      ) : (
        <form method="post" onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          startTransition(async () => setFeedback(await submitSurveyAction(postId, answers, payout === "draw" ? { value: contact, agree } : undefined)));
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
                  {q.allowOther && (
                    <div className="rounded-lg border border-line px-3 py-3 text-[14px] has-[:checked]:border-[#dab96a]">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input type="radio" name={`survey-${q.id}`} checked={isOther(answers[q.id])} required={q.required} onChange={() => setAnswer(q.id, SURVEY_OTHER_PREFIX)} className="accent-[#bd870c]" />
                        {SURVEY_OTHER_LABEL} (직접 입력)
                      </label>
                      {isOther(answers[q.id]) && (
                        <input type="text" autoFocus maxLength={SURVEY_OTHER_MAX} required value={(answers[q.id] ?? "").slice(SURVEY_OTHER_PREFIX.length)} onChange={(e) => setAnswer(q.id, SURVEY_OTHER_PREFIX + e.target.value)} placeholder="직접 입력해주세요" aria-label={`${q.title} 기타 내용`} className="field mt-2" />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <textarea className="field min-h-[86px] resize-y" maxLength={500} required={q.required} value={answers[q.id] ?? ""} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder="답변을 입력해주세요. (최대 500자)" />
              )}
            </fieldset>
          ))}
          {payout === "draw" && (
            <fieldset className="space-y-2.5 rounded-xl bg-[#fffaf0] p-3.5">
              <legend className="text-[14px] font-bold text-ink">추첨 안내 연락처<span className="ml-1 text-brand-dark" aria-label="필수">*</span></legend>
              <input type="text" inputMode="email" autoComplete="off" required maxLength={100} value={contact} onChange={(e) => { setContact(e.target.value); setFeedback(null); }} className="field" placeholder="이메일 또는 휴대폰 번호 (예: 010-1234-5678)" />
              <label className="flex cursor-pointer items-start gap-2 text-[12.5px] leading-relaxed text-ink-2">
                <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-[#bd870c]" />
                당첨 안내 목적으로 연락처를 수집하여 이 홍보글 작성자에게 제공하는 데 동의합니다. 당첨자 선정과 혜택 지급은 작성자(업체)가 직접 하며 더홍보는 관여하지 않습니다.
              </label>
            </fieldset>
          )}
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
