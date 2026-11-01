"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMeetupAction } from "@/app/actions/meetup";

export function MeetupForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<{ text: string; login?: boolean } | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      setError(null);
      const r = await createMeetupAction(title, body);
      if (r.ok) {
        router.push(`/meetup/${r.id}`);
        router.refresh();
        return;
      }
      setError({ text: r.message, login: r.login });
    });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"
    >
      <div>
        <label htmlFor="meetup-title" className="mb-1.5 block text-sm font-semibold text-ink-2">
          제목
        </label>
        <input id="meetup-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className="field" placeholder="제목을 입력해주세요" />
      </div>
      <div>
        <label htmlFor="meetup-body" className="mb-1.5 block text-sm font-semibold text-ink-2">
          내용
        </label>
        <textarea
          id="meetup-body"
          rows={10}
          maxLength={3000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="field resize-y leading-relaxed"
          placeholder="홍보 이야기, 질문, 고민, 정보 공유… 편하게 적어주세요."
        />
        <p className="mt-1 text-right text-xs text-faint">{body.length.toLocaleString()} / 3,000</p>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-brand-dark">
          {error.text}{" "}
          {error.login && (
            <Link href="/auth?next=/meetup/write" className="font-bold underline">
              로그인하기
            </Link>
          )}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Link href="/meetup" className="btn btn-outline">
          취소
        </Link>
        <button type="submit" disabled={pending} className="btn btn-primary min-w-[120px]">
          {pending ? "올리는 중…" : "글 올리기"}
        </button>
      </div>
    </form>
  );
}
