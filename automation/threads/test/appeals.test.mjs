import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const owner='00000000-0000-0000-0000-000000000001';
const admin='00000000-0000-0000-0000-000000000002';
async function setup(){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table posts(id bigint primary key,author_id uuid,status text,updated_at timestamptz default now());
 insert into posts(id,author_id,status) values(1,'${owner}','active');`);
 await db.exec(await readFile(new URL('../../../supabase/migrations/0012_post_appeals.sql',import.meta.url),'utf8'));
 return db;
}
async function step(db,action,text='보완한 내용을 상세하게 작성했습니다. 서비스 기능과 이용 조건을 확인해주세요.',version=null,source=null,actor=admin){
 return db.query('select post_appeal_transition($1,$2,$3,$4,$5,$6)',[1,actor,action,text,version,source]);
}
async function state(db){return (await db.query('select * from post_appeals where post_id=1')).rows[0];}
test('reason, owner appeal, denial and email-only second stage; approval is atomic and private',async()=>{
 const db=await setup();try{
 await step(db,'hidden','내용을 더 성실히 작성해주세요');
 assert.equal((await state(db)).reason,'내용을 더 성실히 작성해주세요');
 await assert.rejects(step(db,'submit',undefined,1,null,admin),/NOT_OWNER/);
 await step(db,'submit',undefined,1,null,owner);
 await assert.rejects(step(db,'submit',undefined,2,null,owner),/ALREADY_PENDING/);
 await step(db,'reject','공개 운영 정보를 확인할 수 없어 2차 자료가 필요합니다.',2);
 await assert.rejects(step(db,'submit',undefined,3,null,owner),/SECOND_STAGE_EMAIL_ONLY/);
 const source=(await db.query('select updated_at::text t from posts')).rows[0].t;
 await assert.rejects(step(db,'approve','확인 완료',2,source),/STALE_REVIEW/);
 await db.exec("update posts set updated_at=updated_at+interval '1 second'");
 await assert.rejects(step(db,'approve','확인 완료',3,source),/SOURCE_CHANGED/);
 const current=(await db.query('select updated_at::text t from posts')).rows[0].t;
 await step(db,'approve','이메일로 받은 PDF와 실제 사이트를 확인했습니다.',3,current);
 assert.equal((await state(db)).state,'approved');
 assert.equal((await db.query('select status from posts')).rows[0].status,'active');
 assert.equal((await state(db)).events.length,4);
 for(const role of ['anon','authenticated']){
 assert.equal((await db.query("select has_table_privilege($1,'post_appeals','select') ok",[role])).rows[0].ok,false);
 assert.equal((await db.query("select has_function_privilege($1,'post_appeal_transition(bigint,uuid,text,text,integer,timestamptz)','execute') ok",[role])).rows[0].ok,false);
 }
 }finally{await db.close();}
});
test('legacy hidden posts can appeal, revision can resubmit, repeated moderation invalidates old forms',async()=>{
 const db=await setup();try{
 await db.exec("update posts set status='blocked'");
 await step(db,'submit',undefined,0,null,owner);
 await step(db,'revision','기능 설명과 공개 주소를 더 구체적으로 보완해주세요.',1);
 await step(db,'submit',undefined,2,null,owner);
 await step(db,'blocked','새로운 정책 위반 사유 확인');
 await assert.rejects(step(db,'submit',undefined,3,null,owner),/STALE_REVIEW/);
 await step(db,'submit',undefined,4,null,owner);
 await step(db,'pdf_requested','2차 신청서를 이메일로 제출해주세요.',5);
 await assert.rejects(step(db,'submit',undefined,6,null,owner),/SECOND_STAGE_EMAIL_ONLY/);
 await db.exec("update posts set status='deleted'");
 await assert.rejects(step(db,'restore'),/POST_UNAVAILABLE/);
 }finally{await db.close();}
});
