"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMeetupAction } from "@/app/actions/meetup";

export function MeetupDeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("이 글을 삭제할까요?")) return;
          start(async () => {
            const r = await deleteMeetupAction(id);
            if (r.ok) {
              router.push("/meetup");
              router.refresh();
            } else setError(r.message);
          });
        }}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-brand"
      >
        <Trash2 size={14} aria-hidden /> 삭제
      </button>
      {error && <span className="text-xs text-brand-dark">{error}</span>}
    </span>
  );
}
