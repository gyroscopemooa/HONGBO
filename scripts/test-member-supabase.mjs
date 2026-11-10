// Explicit, manual integration test. Creates only disposable QA users/content,
// exercises the built app over HTTP, and removes those exact records in finally.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert(process.env.HONGBO_TEST_PROJECT_REF, 'Set the independently verified project ref explicitly');
assert.equal(new URL(url).hostname, `${process.env.HONGBO_TEST_PROJECT_REF}.supabase.co`);
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const marker = `community-qa-${randomUUID()}`;
const people = [];
const postIds = [];
const origin = 'http://127.0.0.1:3315';
const manifest = JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json', 'utf8'));
const actions = Object.fromEntries(Object.entries(manifest.node).filter(([,v]) => v.filename?.includes('member-community')).map(([id,v]) => [v.exportedName,id]));
let server;
function check(result) { if (result.error) throw new Error(result.error.message); return result.data; }
async function call(who, name, args) {
  assert(actions[name], `Missing action ${name}`);
  const response = await fetch(`${origin}/talk/write`, { method: 'POST', headers: { 'Content-Type':'text/plain;charset=UTF-8', 'Next-Action':actions[name], Origin:origin, Cookie:who?.cookie ?? '' }, body:JSON.stringify(args) });
  const body = await response.text();
  const result = body.split('\n').map(line => { try { return JSON.parse(line.slice(line.indexOf(':')+1)); } catch { return null; } }).find(value => value && typeof value.ok === 'boolean');
  assert(result, `${name}: missing result (HTTP ${response.status})`);
  return result;
}
async function page(who, path) { return (await fetch(origin+path, {headers:{Cookie:who?.cookie ?? ''}})).text(); }
try {
  for (const role of ['owner','reader','admin']) {
    const email = `${marker}-${role}@example.invalid`;
    const password = randomUUID()+randomUUID();
    const { user } = check(await db.auth.admin.createUser({email,password,email_confirm:true}));
    const who = {id:user.id,email,cookie:''};
    people.push(who);
    check(await db.from('profiles').upsert({id:user.id,nickname:`검수-${role}`,email,status:'active'}));
    const jar = new Map();
    const client = createServerClient(url,anonKey,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(({name,value})=>jar.set(name,value))}});
    check(await client.auth.signInWithPassword({email,password}));
    who.cookie = [...jar].map(([name,value])=>`${name}=${value}`).join('; ');
    who.client = client;
  }
  const [owner,reader,admin] = people;
  server = spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3315'],{env:{...process.env,ADMIN_EMAILS:admin.email},stdio:'ignore'});
  for (let i=0;i<60;i++) { try { if ((await fetch(origin+'/api/health')).ok) break; } catch {} await new Promise(r=>setTimeout(r,500)); }
  const input = {title:'[검수 후 삭제] 회원 커뮤니티 기능 확인',body:'운영 기능 검증용 임시 글입니다. 검증 종료 시 삭제됩니다.',category:'fragrance',purpose:'feedback',details:{acceptApplications:true}};
  assert.equal((await call(null,'saveMemberPostAction',[input])).ok,false);
  const saved = await call(owner,'saveMemberPostAction',[input]); assert.equal(saved.ok,true); postIds.push(saved.id);
  const id = saved.id;
  assert.equal((await call(reader,'saveMemberPostAction',[{...input,title:'권한 없는 수정'},id])).ok,false);
  assert.equal((await call(reader,'setMemberPostStateAction',[id,'hide'])).ok,false);
  for (const category of ['app','web','game','shop','food','cosmetics','fragrance','clothing']) {
    check(await db.from('member_posts').update({payload:{...input,category}}).eq('id',id));
    assert((await page(null,`/talk?category=${category}`)).includes(input.title),`category ${category}`);
  }
  assert.equal((await fetch(origin+'/talk?page=1.5')).status,200);
  const comment = await call(reader,'addMemberCommentAction',[id,'검수 댓글']); assert.equal(comment.ok,true);
  const reply = await call(owner,'addMemberCommentAction',[id,'검수 답글',comment.id]); assert.equal(reply.ok,true);
  assert.equal((await call(reader,'addMemberCommentAction',[id,'허용되지 않는 답글',reply.id])).ok,false);
  const notes = check(await db.from('member_notifications').select('*').eq('post_id',id));
  assert(notes.some(n=>n.recipient_id===owner.id && n.kind==='comment'));
  assert(notes.some(n=>n.recipient_id===reader.id && n.kind==='reply'));
  assert.equal((await call(owner,'markMemberNotificationsReadAction',[])).ok,true);
  assert.equal(check(await db.from('member_notifications').select('is_read').eq('post_id',id).eq('recipient_id',reader.id))[0].is_read,false);
  const applied = await call(reader,'applyMemberPostAction',[id,marker]); assert.equal(applied.ok,true);
  assert.equal((await call(reader,'applyMemberPostAction',[id,'중복'])).ok,false);
  assert(!(await page(null,`/talk/${id}`)).includes(marker),'Anonymous application leak');
  assert((await page(owner,`/talk/${id}`)).includes(marker));
  assert.equal((await call(reader,'setMemberApplicationStatusAction',[applied.id,'accepted'])).ok,false);
  assert.equal((await call(owner,'setMemberApplicationStatusAction',[applied.id,'accepted'])).ok,true);
  assert.equal((await call(reader,'cancelMemberApplicationAction',[id])).ok,true);
  assert.equal((await call(owner,'setMemberApplicationStatusAction',[applied.id,'accepted'])).ok,false);
  assert.equal((await call(reader,'applyMemberPostAction',[id,'재신청'])).ok,true);
  assert.equal((await call(reader,'cancelMemberApplicationAction',[id])).ok,true);
  assert.equal((await call(owner,'setMemberPostStateAction',[id,'close'])).ok,true);
  assert.equal((await call(reader,'applyMemberPostAction',[id,'마감 후 신청'])).ok,false);
  assert.equal((await call(reader,'reportMemberContentAction',[id,'검수 신고'])).ok,true);
  assert((await page(admin,'/admin/talk')).includes('검수 신고'));
  assert(!(await page(reader,'/admin/talk')).includes('회원 커뮤니티 신고'));
  assert.equal((await call(admin,'setMemberPostStateAction',[id,'hide'])).ok,true);
  assert(!(await page(null,`/talk/${id}`)).includes(input.title));
  assert.equal((await call(reader,'addMemberCommentAction',[id,'숨긴 글 댓글'])).ok,false);
  assert.equal((await call(admin,'setMemberPostStateAction',[id,'restore'])).ok,true);
  assert.equal((await call(owner,'deleteMemberCommentAction',[comment.id])).ok,false);
  assert.equal((await call(admin,'deleteMemberCommentAction',[comment.id])).ok,true);
  check(await db.from('profiles').update({status:'blocked'}).eq('id',reader.id));
  assert.equal((await call(reader,'addMemberCommentAction',[id,'차단 회원 댓글'])).ok,false);
  for (const table of ['member_posts','member_comments','member_applications','member_notifications','member_reports']) {
    assert((await reader.client.from(table).select('*')).error,`Direct access allowed: ${table}`);
  }
  console.log('PASS: real Supabase owner/reader/admin sessions; server action authorization, categories, comments/replies, notification isolation/read, private applications/approval/cancel/reapply/closed state, reports/hide/restore, blocked user and RLS.');
} finally {
  server?.kill();
  for (const id of postIds) {
    check(await db.from('member_comments').update({parent_id:null}).eq('post_id',id));
    check(await db.from('member_posts').delete().eq('id',id));
  }
  for (const who of people) {
    check(await db.auth.admin.deleteUser(who.id));
  }
  console.log('Cleanup complete: only this run\'s temporary users/content removed.');
}
