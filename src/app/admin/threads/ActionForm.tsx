"use client";
import { useActionState } from "react";
import { INITIAL_THREADS_STATE, type ThreadsActionState } from "@/lib/threads-admin-validation";

export function ActionForm({ action, children, className }: {
  action: (state: ThreadsActionState, form: FormData) => Promise<ThreadsActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_THREADS_STATE);
  return <form action={formAction} aria-busy={pending}>
    <fieldset disabled={pending} className={className}>{children}</fieldset>
    <p role="status" aria-live="polite" className={`mt-2 text-sm ${state.ok ? "text-green-700" : "text-red-700"}`}>
      {pending ? "처리 중입니다…" : state.message}
    </p>
  </form>;
}
