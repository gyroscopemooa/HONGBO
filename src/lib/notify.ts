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

/** 설정 점검용 테스트 발송 — 결과를 사람이 읽을 수 있는 문장으로 돌려줍니다. (키 값은 노출하지 않음) */
export async function sendTestNotify(): Promise<{ ok: boolean; message: string }> {
  const key = process.env.RESEND_API_KEY;
  const to = (process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAILS || "").split(",")[0]?.trim();
  const from = process.env.NOTIFY_FROM || "더홍보 <onboarding@resend.dev>";
  if (!key) return { ok: false, message: "RESEND_API_KEY가 설정되지 않았어요. 시크릿을 넣고 재배포해주세요." };
  if (!to) return { ok: false, message: "받는 주소가 없어요. NOTIFY_EMAIL 또는 ADMIN_EMAILS를 설정해주세요." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: "[더홍보] 알림 테스트", text: "이 메일이 보이면 알림 설정이 정상이에요." }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true, message: `발송 요청 성공 → ${to} (보낸 주소: ${from}). 받은편지함·스팸함을 확인해주세요.` };
    const body = (await res.text()).slice(0, 300);
    return { ok: false, message: `Resend 오류 ${res.status}: ${body}` };
  } catch (error) {
    return { ok: false, message: `발송 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}` };
  }
}
