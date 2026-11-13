import { getAdminClient } from "@/lib/supabase/admin";
export async function POST(request: Request) {
  const token = process.env.AUTO_COMMENTS_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!token || token.length < 32 || supplied.length > 256) return new Response(null, { status: 404 });
  const digest = async (s: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([digest(token), digest(supplied)]);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  if (mismatch) return new Response(null, { status: 404 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return new Response(null, { status: 415 });
  const text = await request.text();
  if (text.length > 2048) return new Response(null, { status: 413 });
  try {
    const input = JSON.parse(text);
    if (!input || typeof input !== "object") return new Response(null, { status: 400 });
    if (input.action === "claim_auto_comment") {
      const { data, error } = await getAdminClient().rpc("claim_auto_comment");
      if (error) return new Response(null, { status: 503 });
      return Response.json(data, { headers: { "Cache-Control": "no-store" } });
    }
    if (input.action !== "finish_auto_comment" || !Number.isSafeInteger(input.p_post_id) || input.p_post_id < 1 || (input.p_body !== null && (typeof input.p_body !== "string" || input.p_body.length > 240))) return new Response(null, { status: 400 });
    const { data, error } = await getAdminClient().rpc("finish_auto_comment", { p_post_id: input.p_post_id, p_body: input.p_body });
    if (error) return new Response(null, { status: 503 });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch { return new Response(null, { status: 400 }); }
}
