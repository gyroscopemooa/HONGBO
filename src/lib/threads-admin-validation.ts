export type ThreadsActionState = { ok: boolean; message: string };
export const INITIAL_THREADS_STATE: ThreadsActionState = { ok: false, message: "" };

export function parseThreadsModeration(form: FormData) {
  const id = Number(form.get("post_id"));
  const hash = String(form.get("hash") ?? "");
  const decision = form.get("decision");
  if (!Number.isSafeInteger(id) || id < 1 || !/^[a-f0-9]{32}$/.test(hash) || !["reviewed_approve", "exclude"].includes(String(decision))) {
    return { error: "잘못된 요청입니다. 새로고침 후 다시 확인해주세요." } as const;
  }
  // The explicit review-approval submit button is the administrator's attestation.
  // Legacy plain approve requests are rejected above, rather than silently bypassing review.
  return { id, hash, excluded: decision === "exclude" } as const;
}
