import test from 'node:test';
import assert from 'node:assert/strict';
import { runOnce, hasSensitiveContent, tokenHealth } from '../src/index.mjs';
const env = { AUTOPOST_ENABLED:'true', THREADS_START_AT:'2026-11-01', THREADS_TOKEN_EXPIRES_AT:'2099-01-01', SUPABASE_URL:'https://db.test', SUPABASE_SERVICE_ROLE_KEY:'secret-db', THREADS_ACCESS_TOKEN:'secret-threads' };
const post = { post_id:123, lease:'lease', title:'새 서비스', short_description:'서비스 소개', description:'자세한 소개', use_ai:true };
async function scenario(options={}) {
  const calls=[]; const old=globalThis.fetch;
  globalThis.fetch=async (url,init={}) => {
    assert.equal(init.redirect, 'manual');
    const body = init.body instanceof URLSearchParams ? Object.fromEntries(init.body) : init.body ? JSON.parse(init.body) : null;
    calls.push({url,body});
    if (options.fail && url.includes(options.fail)) throw new Error('secret-threads secret-db');
    let data;
    if (url.includes('/me?')) data={id:'42',username:options.wrong?'wrong':'iamthehongbo'};
    else if (url.includes('/rest/v1/posts?')) data=[{published_at:'2026-01-01T00:00:00Z'}];
    else if (url.endsWith('threads_claim_one')) data=[{...post,...options.post}];
    else if (url.endsWith('threads_prepare_publish')) data=options.ineligible?false:true;
    else if (url.endsWith('threads_complete')) data=true;
    else if (url.endsWith('/threads_publish')) data={id:'999'};
    else if (url.endsWith('/threads')) { assert.equal(body.auto_publish_text,undefined); data={id:'888'}; }
    else if (url.includes('fields=id,status')) data={status:'FINISHED'};
    else if (url.includes('permalink')) data={permalink:'https://www.threads.com/@iamthehongbo/post/example'};
    else if (url.includes('openai')) data={choices:[{message:{content:options.ai??'0'}}]};
    else throw Error('unexpected URL');
    return Response.json(data);
  };
  try { return {result:await runOnce({...env,USE_AI:'true',ALLOW_PAID_AI:'true',OPENAI_API_KEY:'fake',...options.env}),calls}; }
  finally {globalThis.fetch=old;}
}
test('two-step publishing and durable gate precede the only publish request',async()=>{
  const {result,calls}=await scenario(); assert.equal(result,'published');
  assert.ok(calls.findIndex(c=>c.url.endsWith('threads_prepare_publish'))<calls.findIndex(c=>c.url.endsWith('/threads_publish')));
  assert.equal(calls.filter(c=>c.url.endsWith('/threads_publish')).length,1);
  assert.equal(calls.at(-1).body.p_threads_id,'999');
});
test('wrong account blocks before claiming',async()=>{await assert.rejects(scenario({wrong:true}),/ACCOUNT_MISMATCH/);});
test('token copy whitespace is trimmed; embedded whitespace blocks before any API call',async()=>{
  assert.equal((await scenario({env:{THREADS_ACCESS_TOKEN:'  secret-threads\n'}})).result,'published');
  await assert.rejects(scenario({env:{THREADS_ACCESS_TOKEN:'secret\nthreads'}}),/TOKEN_FORMAT_INVALID/);
});
test('sensitive source blocks before AI or container requests',async()=>{
  const {result,calls}=await scenario({post:{description:'문의 010-1234-5678'}}); assert.equal(result,'blocked');
  assert.ok(!calls.some(c=>c.url.includes('openai')||c.url.endsWith('/threads')));
});
test('eligibility revoked just before publishing blocks the request',async()=>{
  const {result,calls}=await scenario({ineligible:true}); assert.equal(result,'blocked'); assert.ok(!calls.some(c=>c.url.endsWith('/threads_publish')));
});
test('ambiguous publish failure is review, never retry, and logs contain no secrets',async()=>{
  const {result,calls}=await scenario({fail:'/threads_publish'}); assert.equal(result,'review');
  assert.equal(calls.at(-1).body.p_status,'review'); assert.doesNotMatch(JSON.stringify(calls.at(-1).body),/secret/);
});
test('safe pre-publication failure may be retried',async()=>{
  const {result,calls}=await scenario({fail:'fields=id,status'}); assert.equal(result,'retry'); assert.ok(!calls.some(c=>c.url.endsWith('/threads_publish')));
});
test('AI failure falls back to source and still succeeds',async()=>{assert.equal((await scenario({fail:'openai'})).result,'published');});
test('free mode blocks paid AI even when admin AI and an API key are enabled',async()=>{
  for (const allowed of [undefined, 'false']) {
    const {result,calls}=await scenario({env:{ALLOW_PAID_AI:allowed}});
    assert.equal(result,'published');
    assert.ok(!calls.some(c=>c.url.includes('openai')));
    assert.match(calls.find(c=>c.url.endsWith('/threads')).body.text,/서비스 소개/);
  }
});
test('model prompt injection cannot insert invented facts',async()=>{
  const {calls}=await scenario({ai:'무조건 90% 할인!'}); const draft=calls.find(c=>c.url.endsWith('/threads')).body.text;
  assert.doesNotMatch(draft,/90%/); assert.match(draft,/서비스 소개/);
});
test('missing or expired token expiry blocks all network calls',async()=>{
  for (const expiry of ['', '2000-01-01']) { const {result,calls}=await scenario({env:{THREADS_TOKEN_EXPIRES_AT:expiry}}); assert.equal(result,'token-blocked'); assert.equal(calls.length,0); }
});
test('token health and sensitive patterns',()=>{
  assert.equal(tokenHealth({THREADS_TOKEN_EXPIRES_AT:new Date(Date.now()+86400000).toISOString()}),'expiring');
  for (const description of ['hello@example.com','계좌 123','900101-1234567','０１０－１２３４－５６７８']) assert.ok(hasSensitiveContent({description}));
});
