import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sendTestNotify } from "@/lib/notify";

export const dynamic = "force-dynamic";

async function testAction() {
  "use server";
  await requireAdmin();
  const r = await sendTestNotify();
  redirect(`/admin/notify-test?ok=${r.ok ? 1 : 0}&m=${encodeURIComponent(r.message)}`);
}

export default async function NotifyTest({ searchParams }: { searchParams: Promise<{ ok?: string; m?: string }> }) {
  await requireAdmin();
  const { ok, m } = await searchParams;
  return (
    <div>
      <h1 className="text-[22px] font-extrabold">알림 메일 테스트</h1>
      <p className="mt-1 text-[14px] text-muted">버튼을 누르면 운영자 알림 주소로 테스트 메일을 한 통 보내요.</p>
      <form action={testAction} className="mt-4">
        <button className="btn btn-primary">테스트 메일 보내기</button>
      </form>
      {m && (
        <p role="status" className={`mt-4 rounded-xl border px-4 py-3 text-[14px] ${ok === "1" ? "border-green-300 bg-green-50 text-green-800" : "border-brand bg-brand-soft text-brand-dark"}`}>
          {m}
        </p>
      )}
    </div>
  );
}
