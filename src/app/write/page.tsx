import type { Metadata } from "next";
import { Ban } from "lucide-react";
import { PostForm } from "@/components/PostForm";
import { TrackEvent } from "@/components/TrackEvent";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "홍보글 작성",
  robots: { index: false, follow: false },
};

export default async function WritePage() {
  const user = await requireUser("/write");

  return (
    <div className="wrap py-6 sm:py-9">
      <header className="mb-6">
        <h1 className="text-[26px] font-black tracking-[-0.045em] sm:text-[32px]">홍보글 작성하기</h1>
        <p className="mt-1.5 text-[15px] text-muted">무엇이든 무료예요. 1분이면 충분해요!</p>
      </header>
      {user.status === "blocked" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-brand-line bg-brand-soft p-5 text-brand-dark">
          <Ban size={20} className="mt-0.5 shrink-0" aria-hidden />
          <p className="text-[15px] font-medium">작성이 제한된 계정이에요. 자세한 내용은 문의하기로 연락해주세요.</p>
        </div>
      ) : (
        <>
          <TrackEvent type="write_start" />
          <PostForm mode="create" />
        </>
      )}
    </div>
  );
}
