import type { Metadata } from "next";
import { ReviewForm } from "@/components/ReviewForm";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "후기 쓰기", robots: { index: false, follow: false } };

export default async function ReviewWritePage() {
  await requireUser("/reviews/write");
  return (
    <div className="wrap max-w-[760px] py-8 sm:py-10">
      <h1 className="mb-5 text-[24px] font-black tracking-[-0.04em]">후기 쓰기</h1>
      <ReviewForm />
    </div>
  );
}
