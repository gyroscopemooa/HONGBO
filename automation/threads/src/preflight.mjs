// Operator-only read-only check. Removing PREFLIGHT_KEY closes this endpoint.
export async function preflight(request, env, verifyProfile, tokenHealth) {
  const denied = () => new Response('Not found', { status: 404 });
  if (request.method !== 'POST' || new URL(request.url).pathname !== '/internal/preflight' || !env.PREFLIGHT_KEY) return denied();
  const supplied = request.headers.get('Authorization') ?? '';
  const digest = value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const [a, b] = await Promise.all([digest(supplied), digest('Bearer ' + env.PREFLIGHT_KEY)]);
  const aa = new Uint8Array(a), bb = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < aa.length; i++) difference |= aa[i] ^ bb[i];
  if (difference) return denied();
  let stage = 'profile';
  try {
    await verifyProfile(env);
    stage = 'database';
    const res = await fetch(env.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/threads_promotion_settings?id=eq.true&select=enabled,use_ai,daily_limit', {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY },
      redirect: 'manual', signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error('database');
    const [settings] = await res.json();
    if (!settings) throw new Error('settings');
    return Response.json({ account: '@iamthehongbo', tokenHealth: tokenHealth(env), settings, workerEnabled: env.AUTOPOST_ENABLED === 'true', published: false }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = /^(HTTP_\d{3}|ACCOUNT_MISMATCH|TOKEN_FORMAT_INVALID)$/.test(error?.message ?? '') ? error.message : 'REQUEST_FAILED';
    return Response.json({ error: 'PREFLIGHT_FAILED', stage, code, published: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
