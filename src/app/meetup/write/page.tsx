import type { Metadata } from "next";
import { MeetupForm } from "@/components/MeetupForm";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "홍보소모임 글쓰기", robots: { index: false, follow: false } };

export default async function MeetupWritePage() {
  await requireUser("/meetup/write");
  return (
    <div className="wrap max-w-[760px] py-8 sm:py-10">
      <h1 className="mb-5 text-[24px] font-black tracking-[-0.04em]">홍보소모임 글쓰기</h1>
      <MeetupForm />
    </div>
  );
}
