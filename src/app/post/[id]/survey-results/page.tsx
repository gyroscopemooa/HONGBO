import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, ChevronLeft, ClipboardList } from "lucide-react";
import { SURVEY_CONTACT_ID, SURVEY_OTHER_LABEL, SURVEY_OTHER_PREFIX } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { getSurveyResults } from "@/lib/survey-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "설문 결과", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

export default async function SurveyResultsPage({ params }: Props) {
  const idRaw = (await params).id;
  if (!/^\d{1,12}$/.test(idRaw)) notFound();
  const id = Number(idRaw);
  const user = await requireUser(`/post/${id}/survey-results`);
  const post = await store.getPost(id);
  if (!post || post.status === "deleted" || (post.authorId !== user.id && !user.isAdmin) || post.extra.exclusive?.method !== "survey") notFound();

  const questions = post.extra.exclusive.survey ?? [];
  const result = await getSurveyResults(id);

  return (
    <div className="wrap max-w-[900px] py-6 sm:py-9">
      <Link href={`/post/${id}`} className="mb-5 inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-brand">
        <ChevronLeft size={16} aria-hidden /> 홍보글로 돌아가기
      </Link>
      <header className="mb-7 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#a67408]"><BarChart3 size={17} aria-hidden /> 작성자 전용 · 설문 결과</span>
        <h1 className="mt-2 break-words text-[24px] font-black tracking-[-0.04em]">{post.title}</h1>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-[32px] font-black tabular-nums">{result.total.toLocaleString()}</span>
          <span className="pb-1 text-[14px] text-muted">명 참여</span>
        </div>
        {result.limited && <p className="mt-2 text-[12px] text-muted">표와 주관식 답변은 최근 {result.responses.length.toLocaleString()}건 기준입니다. 총 참여 인원은 전체 기준입니다.</p>}
        <p className="mt-2 text-[12px] text-muted">설문 응답은 작성자와 더홍보 관리자에게만 공개됩니다. {post.extra.exclusive.payout === "draw" ? "추첨 안내 연락처 외에 응답자 신원은 표시하지 않습니다." : "응답자 신원은 표시하지 않습니다."}</p>
      </header>

      {result.total === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <ClipboardList className="mx-auto text-muted" size={28} aria-hidden />
          <p className="mt-3 font-bold">아직 응답이 없어요.</p>
          <p className="mt-1 text-[13px] text-muted">방문자가 홍보글 안에서 설문을 제출하면 이곳에 결과가 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {questions.map((q, index) => {
            const submitted = result.responses.map((r) => ({
              answer: r.answers.find((a) => a.id === q.id)?.answer ?? "",
              createdAt: r.createdAt,
            })).filter((row) => row.answer.length > 0);
            return (
              <section key={q.id} className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                <p className="text-[12px] font-bold text-muted">질문 {index + 1} · {q.type === "choice" ? "객관식" : "주관식"} · {submitted.length}명 응답</p>
                <h2 className="mt-1 mb-4 text-[17px] font-extrabold leading-relaxed">{q.title}</h2>
                {q.type === "choice" ? (
                  <ul className="space-y-3">
                    {(q.options ?? []).map((option) => {
                      const count = submitted.filter((r) => r.answer === option).length;
                      const percent = submitted.length > 0 ? Math.round(count / submitted.length * 100) : 0;
                      return (
                        <li key={option}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
                            <span className="min-w-0 break-words font-semibold">{option}</span>
                            <span className="shrink-0 tabular-nums text-muted">{count}명 · {percent}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-soft" role="img" aria-label={`${option}: ${count}명, ${percent}%`}>
                            <div className="h-full rounded-full bg-[#d5a028]" style={{ width: `${percent}%` }} />
                          </div>
                        </li>
                      );
                    })}
                    {q.allowOther && (() => {
                      const others = submitted.filter((x) => x.answer.startsWith(SURVEY_OTHER_PREFIX));
                      const percent = submitted.length > 0 ? Math.round(others.length / submitted.length * 100) : 0;
                      return (
                        <li>
                          <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
                            <span className="min-w-0 break-words font-semibold">{SURVEY_OTHER_LABEL} (직접 입력)</span>
                            <span className="shrink-0 tabular-nums text-muted">{others.length}명 · {percent}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-soft" role="img" aria-label={`기타: ${others.length}명, ${percent}%`}>
                            <div className="h-full rounded-full bg-[#d5a028]" style={{ width: `${percent}%` }} />
                          </div>
                          {others.length > 0 && (
                            <ul className="mt-2 max-h-[220px] space-y-1.5 overflow-y-auto">
                              {others.map((x, i) => (
                                <li key={i} className="rounded-lg bg-soft px-3 py-2 text-[13px] break-words">{x.answer.slice(SURVEY_OTHER_PREFIX.length)}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })()}
                  </ul>
                ) : (
                  <ul className="max-h-[460px] space-y-2 overflow-y-auto">
                    {submitted.length === 0 ? <li className="text-[13px] text-muted">작성된 답변이 없어요.</li> : submitted.map((row, i) => (
                      <li key={i} className="rounded-lg bg-soft px-3 py-3 text-[13px] leading-relaxed">
                        <p className="whitespace-pre-wrap break-words">{row.answer}</p>
                        <time className="mt-1 block text-[11px] text-muted" dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</time>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
          {post.extra.exclusive.payout === "draw" && (() => {
            const contacts = result.responses
              .map((r) => ({ value: r.answers.find((a) => a.id === SURVEY_CONTACT_ID)?.answer ?? "", createdAt: r.createdAt }))
              .filter((c) => c.value);
            return (
              <section className="rounded-2xl border border-[#edcc7d] bg-[#fffaf0] p-5 shadow-card sm:p-6">
                <p className="text-[12px] font-bold text-[#a67408]">추첨 안내 연락처 · {contacts.length}건</p>
                <h2 className="mt-1 mb-2 text-[17px] font-extrabold">당첨 안내용 연락처</h2>
                <p className="mb-4 text-[12px] leading-relaxed text-muted">참여자가 당첨 안내 목적으로만 제공에 동의한 정보예요. 추첨 외 목적으로 사용하거나 제3자에게 제공하지 마세요. 당첨자 선정과 지급은 작성자가 직접 진행합니다.</p>
                <ul className="max-h-[460px] space-y-2 overflow-y-auto">
                  {contacts.length === 0 ? <li className="text-[13px] text-muted">아직 연락처가 없어요.</li> : contacts.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 text-[13px]">
                      <span className="min-w-0 select-all break-all font-mono font-semibold">{c.value}</span>
                      <time className="shrink-0 text-[11px] text-muted" dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</time>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })()}
        </div>
      )}
    </div>
  );
}
