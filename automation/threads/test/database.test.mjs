import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const actor='00000000-0000-0000-0000-000000000001';
async function setup(){
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create table posts(id bigint primary key,author_id uuid,category text default 'apps',title text,short_description text,description text,contact text,address text,extra jsonb default '{}',external_url text,status text default 'active',is_seed boolean default false,published_at timestamptz default now(),bumped_at timestamptz default now(),expires_at timestamptz);`);
 for(const file of ['0001_threads_promotion.sql','0002_safe_queue.sql','0003_category_rotation.sql']) await db.exec(await readFile(new URL('../sql/'+file,import.meta.url),'utf8'));
 return db;
}
async function add(db,id,approve=true){
 await db.query(`insert into posts(id,author_id,title,short_description,description) values($1,$2,'제목','소개','본문')`,[id,actor]);
 if(approve){
  await db.query('select threads_consent($1,$2,true)',[id,actor]);
  await db.query('select threads_moderate($1,$2,(select threads_source_hash(p) from posts p where id=$1),false)',[id,actor]);
 }
}
async function claim(db){return (await db.query(`select * from threads_claim_one(now()-interval '1 day',20)`)).rows;}
async function enable(db){await db.exec('update threads_promotion_settings set enabled=true');}
async function prepare(db,j){return (await db.query("select threads_prepare_publish($1,$2,'123','draft') as ok",[j.post_id,j.lease])).rows[0].ok;}
test('SQL migration, default OFF, consent, privacy approval, stale content and excluded states',async()=>{
 const db=await setup(); try{
 await add(db,1); assert.equal((await claim(db)).length,0); await enable(db);
 await add(db,2,false); await add(db,3); await add(db,4); await add(db,5); await add(db,6); await add(db,7); await add(db,8);
 await db.exec(`update posts set is_seed=true where id=3; update posts set status='hidden' where id=4; update posts set status='deleted' where id=5; update posts set published_at=now()-interval '10 days',bumped_at=now() where id=6; update posts set title='수정' where id=7; update threads_promotion_permissions set excluded=true where post_id=8;`);
 const rows=await claim(db); assert.equal(rows.length,1); assert.equal(rows[0].post_id,1); assert.equal((await claim(db)).length,0);
 await db.query('select threads_consent($1,$2,false)',[1,actor]); assert.equal(await prepare(db,rows[0]),false);
 }finally{await db.close();}
});
test('daily cap, unique jobs and fencing prevent competing claims and unsafe retries',async()=>{
 const db=await setup();try{
 await enable(db);await db.exec('update threads_promotion_settings set daily_limit=1');await add(db,1);await add(db,2);
 const [a,b]=await Promise.all([claim(db),claim(db)]); assert.equal(a.length+b.length,1); const j=[...a,...b][0];
 assert.equal(await prepare(db,{...j,lease:'00000000-0000-0000-0000-000000000002'}),false);
 assert.equal(await prepare(db,j),true); assert.equal(await prepare(db,j),false);
 assert.equal((await db.query('select threads_retry($1) as ok',[j.post_id])).rows[0].ok,false);
 await db.query("select threads_complete($1,$2,'review','TIMEOUT',null,null)",[j.post_id,j.lease]);
 assert.equal((await db.query('select threads_retry($1) as ok',[j.post_id])).rows[0].ok,false);
 assert.equal((await claim(db)).length,0);
 }finally{await db.close();}
});
test('safe retry is bounded, stale execution enters review, deleted posts retain history, RPCs private',async()=>{
 const db=await setup();try{
 await enable(db);await add(db,1);let [j]=await claim(db);
 await db.query("select threads_complete($1,$2,'retry','HTTP_503',null,null)",[j.post_id,j.lease]);
 assert.equal((await claim(db)).length,0);
 await db.exec("update threads_promotion_jobs set next_attempt_at=now()-interval '1 minute'");
 [j]=await claim(db);assert.ok(j);assert.equal((await db.query('select attempts from threads_promotion_jobs')).rows[0].attempts,2);
 await db.exec("update threads_promotion_jobs set claimed_at=now()-interval '16 minutes'");
 assert.equal((await claim(db)).length,0);assert.equal((await db.query('select status from threads_promotion_jobs')).rows[0].status,'review');
 await db.exec('delete from posts where id=1');assert.equal((await db.query('select count(*)::int n from threads_promotion_jobs')).rows[0].n,1);
 for(const role of ['anon','authenticated']){
  assert.equal((await db.query(`select has_function_privilege($1,'threads_claim_one(timestamptz,integer)','execute') ok`,[role])).rows[0].ok,false);
  assert.equal((await db.query(`select has_table_privilege($1,'threads_promotion_permissions','select') ok`,[role])).rows[0].ok,false);
 }
 }finally{await db.close();}
});

test('renewal preserves eligibility, changed content invalidates final gate, safe retry gets new snapshot',async()=>{
 const db=await setup();try{
 await enable(db);await add(db,1);await db.exec("update posts set bumped_at=now()+interval '1 hour' where id=1");
 let [j]=await claim(db);assert.ok(j);
 await db.exec("update posts set title='수정된 제목' where id=1");assert.equal(await prepare(db,j),false);
 await db.query("select threads_complete($1,$2,'blocked','CHANGED',null,null)",[j.post_id,j.lease]);
 await db.query('select threads_moderate($1,$2,(select threads_source_hash(p) from posts p where id=$1),false)',[1,actor]);
 await db.query('select threads_retry(1)');[j]=await claim(db);assert.equal(await prepare(db,j),true);
 }finally{await db.close();}
});
test('legacy ambiguous jobs cannot be manually resent and midnight reservations consume capacity',async()=>{
 const db=await setup();try{
 await db.exec(`create or replace function pg_catalog.now() returns timestamptz language sql stable as $$select '2026-11-07T15:01:00Z'::timestamptz$$`);
 await enable(db);await add(db,1);await add(db,2);
 await db.exec("insert into threads_promotion_jobs(post_id,status) values(1,'review')");
 assert.equal((await db.query('select threads_retry(1) ok')).rows[0].ok,false);
 await db.exec("update threads_promotion_settings set daily_limit=1; update threads_promotion_jobs set status='processing',claimed_at=date_trunc('day',now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul' - interval '1 second'");
 // A previous-day in-flight reservation is counted; stale executions are quarantined first.
 const rows=await claim(db);assert.equal(rows.length,0);
 }finally{await db.close();}
});

test('category rotation serves eligible categories fairly and preserves oldest-first within category',async()=>{
 const db=await setup();try{
 await enable(db);await db.exec('update threads_promotion_settings set daily_limit=20');
 for(let id=1;id<=6;id++) await add(db,id);
 await db.exec("update posts set category=case when id<=3 then 'apps' when id<=5 then 'services' else 'events' end");
 const ids=[];
 for(let i=0;i<6;i++){
  const [j]=await claim(db);ids.push(j.post_id);
  await db.query("select threads_complete($1,$2,'blocked','TEST',null,null)",[j.post_id,j.lease]);
 }
 assert.deepEqual(ids,[1,4,6,2,5,3]);
 assert.equal((await claim(db)).length,0);
 }finally{await db.close();}
});
test('rotation skips ineligible categories without blocking a single available category',async()=>{
 const db=await setup();try{
 await enable(db);await add(db,1);await add(db,2);await add(db,3,false);
 await db.exec("update posts set category='events' where id=3");
 const [first]=await claim(db);assert.equal(first.post_id,1);
 await db.query("select threads_complete($1,$2,'blocked','TEST',null,null)",[first.post_id,first.lease]);
 assert.equal((await claim(db))[0].post_id,2);
 assert.equal((await claim(db)).length,0);
 }finally{await db.close();}
});
