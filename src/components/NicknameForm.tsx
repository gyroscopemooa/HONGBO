"use client";

import { useActionState } from "react";
import { updateNicknameAction, type ActionResult } from "@/app/actions/posts";

export function NicknameForm({ nickname }: { nickname: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateNicknameAction, null);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="nickname" className="text-sm font-bold text-ink-2">
        닉네임
      </label>
      <input id="nickname" name="nickname" defaultValue={nickname} maxLength={16} className="field !h-10 !py-2 sm:max-w-[220px]" />
      <button type="submit" disabled={pending} className="btn btn-outline btn-sm">
        {pending ? "저장 중…" : "저장"}
      </button>
      {state && (
        <span role="status" className={state.ok ? "text-[13px] text-[#12804a]" : "text-[13px] font-medium text-brand-dark"}>
          {state.ok ? state.message : state.message}
        </span>
      )}
    </form>
  );
}
