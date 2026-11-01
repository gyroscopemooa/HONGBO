import "server-only";

/** 운영자에게 이메일 알림을 보냅니다. RESEND_API_KEY가 없으면 조용히 건너뛰고, 실패해도 접수에는 영향이 없습니다. */
export async function notifyAdmin(subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = (process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAILS || "").split(",")[0]?.trim();
  if (!key || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM || "더홍보 <onboarding@resend.dev>", to: [to], subject, text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("notify failed", res.status);
  } catch (error) {
    console.error("notify failed", error);
  }
}
