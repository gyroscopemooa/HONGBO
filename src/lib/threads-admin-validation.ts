export type ThreadsActionState = { ok: boolean; message: string };
export const INITIAL_THREADS_STATE: ThreadsActionState = { ok: false, message: "" };

export function parseThreadsModeration(form: FormData) {
  const id = Number(form.get("post_id"));
  const hash = String(form.get("hash") ?? "");
  const decision = form.get("decision");
  if (!Number.isSafeInteger(id) || id < 1 || !/^[a-f0-9]{32}$/.test(hash) || !["approve", "exclude"].includes(String(decision))) {
    return { error: "잘못된 요청입니다. 새로고침 후 다시 확인해주세요." } as const;
  }
  if (decision === "approve" && form.get("reviewed") !== "on") {
    return { error: "승인하려면 먼저 원문 전체와 링크 미리보기의 개인정보·민감정보 검토 확인란을 체크해주세요." } as const;
  }
  return { id, hash, excluded: decision === "exclude" } as const;
}
