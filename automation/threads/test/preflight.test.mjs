import test from 'node:test';
import assert from 'node:assert/strict';
import { preflight } from '../src/preflight.mjs';
test('preflight fails closed without key and never verifies an unauthorized request', async () => {
  const verify = () => { throw Error('Must not verify'); };
  for (const env of [{}, {PREFLIGHT_KEY:'expected'}]) {
    const response = await preflight(new Request('https://worker.test/internal/preflight', {method:'POST'}),env,verify,()=> 'healthy');
    assert.equal(response.status,404);
  }
});
test('authorized preflight only reads profile/settings and never publishes', async () => {
  const old = globalThis.fetch;
  const calls=[];
  globalThis.fetch=async (url, init)=> { calls.push({url,init}); return Response.json([{enabled:false,use_ai:false,daily_limit:6}]); };
  try {
    const response=await preflight(new Request('https://worker.test/internal/preflight',{method:'POST',headers:{Authorization:'Bearer expected'}}),
      {PREFLIGHT_KEY:'expected',SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'fake'},async()=> '42',()=> 'healthy');
    assert.equal(response.status,200);
    assert.equal((await response.json()).published,false);
    assert.equal(calls.length,1);
    assert.ok(calls[0].url.includes('threads_promotion_settings'));
    assert.equal(calls[0].init.method,undefined);
  } finally { globalThis.fetch=old; }
});
