import { verifyProfile, tokenHealth } from './index.mjs';

// Explicitly called by an operator-side secret-rotation integration, never by cron.
// persist MUST durably store both values in the same protected secret bundle/version.
// No token is returned to a CLI, logged, or written to the application database.
export async function refreshLongLivedToken(env, persist, now = Date.now()) {
  if (typeof persist !== 'function') throw new Error('A secure persistence adapter is required');
  if (['expired','unknown'].includes(tokenHealth(env, now))) throw new Error('Fresh OAuth authorization required');
  const issued = Date.parse(env.THREADS_TOKEN_ISSUED_AT ?? '');
  if (!Number.isFinite(issued) || now - issued < 86400000) throw new Error('Token must be at least 24 hours old');
  await verifyProfile(env);
  let data;
  try {
    const res = await fetch('https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token', {
      headers: { Authorization: 'Bearer ' + env.THREADS_ACCESS_TOKEN },
      signal: AbortSignal.timeout(15000), redirect: 'error',
    });
    if (!res.ok) throw new Error('refresh rejected');
    data = await res.json();
  } catch { throw new Error('Token refresh failed; stored credentials unchanged'); }
  if (typeof data?.access_token !== 'string' || !data.access_token || !Number.isFinite(data.expires_in) || data.expires_in <= 0)
    throw new Error('Invalid token refresh response');
  const next = { ...env, THREADS_ACCESS_TOKEN: data.access_token,
    THREADS_TOKEN_ISSUED_AT: new Date(now).toISOString(),
    THREADS_TOKEN_EXPIRES_AT: new Date(now + data.expires_in * 1000).toISOString() };
  await verifyProfile(next);
  try { await persist({ THREADS_ACCESS_TOKEN: next.THREADS_ACCESS_TOKEN,
    THREADS_TOKEN_ISSUED_AT: next.THREADS_TOKEN_ISSUED_AT, THREADS_TOKEN_EXPIRES_AT: next.THREADS_TOKEN_EXPIRES_AT }); }
  catch { throw new Error('Secure persistence failed; do not activate refreshed credentials'); }
  return { expiresAt: next.THREADS_TOKEN_EXPIRES_AT };
}
