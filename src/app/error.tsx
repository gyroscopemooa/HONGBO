"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="wrap flex flex-col items-center py-20 text-center sm:py-28">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#fff1d6] text-[#a56200]">
        <TriangleAlert size={30} aria-hidden />
      </span>
      <h1 className="mt-5 text-[26px] font-black tracking-[-0.045em]">잠시 문제가 생겼어요</h1>
      <p className="mt-2 text-[15px] text-muted">잠시 후 다시 시도해주세요. 계속되면 문의하기로 알려주세요.</p>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={reset} className="btn btn-primary">
          다시 시도
        </button>
        <Link href="/" className="btn btn-outline">
          홈으로
        </Link>
      </div>
    </div>
  );
}
