import test from 'node:test';
import assert from 'node:assert/strict';
import { freeOnlyEnabled, safeSource, validateComment, run } from '../src/index.mjs';
test('fails closed and expires', () => {
 const now=Date.now(); assert.equal(freeOnlyEnabled({},now),false);
 assert.equal(freeOnlyEnabled({COMMENTS_ENABLED:'true',FREE_TIER_VERIFIED_UNTIL:new Date(now+3600000).toISOString()},now),true);
 assert.equal(freeOnlyEnabled({COMMENTS_ENABLED:'true',FREE_TIER_VERIFIED_UNTIL:new Date(now+90000000).toISOString()},now),false);
});
test('source excludes contact data and is bounded',()=>{assert.equal(safeSource({title:'문의 test@example.com'}),''); assert.equal(safeSource({title:'가'.repeat(2500)}).length,2000);});
test('filters fake experience and links',()=>{assert.equal(validateComment('제가 사용해봤는데 추천합니다.'),null); assert.equal(validateComment('https://test.com 확인하세요?'),null); assert.equal(validateComment('체험 가능한 시간을 안내해 주실 수 있나요?'),'체험 가능한 시간을 안내해 주실 수 있나요?');});
test('disabled worker does not call services', async()=> { await run({AI:{run(){throw Error('called');}}}); });
test('scoped token uses fixed origin without redirects or database keys', async()=>{
 const previous=globalThis.fetch; const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options}); return new Response(JSON.stringify(calls.length===1?[{id:1,title:'강의 복습 서비스'}]:true),{status:200});};
 try {
  await run({COMMENTS_ENABLED:'true',FREE_TIER_VERIFIED_UNTIL:new Date(Date.now()+3600000).toISOString(),AUTO_COMMENTS_TOKEN:'x'.repeat(64),AI_MODEL:'test',AI:{run:async()=>({response:'강의별 복습 방법도 안내해 주실 수 있나요?'})}});
  assert.equal(calls.length,2);
  for(const c of calls){assert.equal(c.url,'https://thehongbo.com/api/internal/auto-comments');assert.equal(c.options.redirect,'error');assert.equal(c.options.headers.apikey,undefined);assert.equal(c.options.headers.Authorization,'Bearer '+'x'.repeat(64));}
  assert.equal(JSON.parse(calls[1].options.body).action,'finish_auto_comment');
 } finally {globalThis.fetch=previous;}
});
