import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EMPTY_PLAY_CONDITIONS, matchesPlayConditions, readPlayConditionFilters } from "../src/lib/play-conditions";
import { PLAY_PLACES } from "../src/data/play";
import { filterPlayPlaces } from "../src/lib/play";
import { parsePostInput } from "../src/lib/validation";
const play={...EMPTY_PLAY_CONDITIONS,kind:"체험·놀거리" as const,subtype:"공방·클래스",notice:"discount" as const,cost:"paid" as const,costDetails:"1인 20,000원 · 재료 포함",visit:"reservation" as const,solo:"no" as const,minPeople:2,maxPeople:6,eligibility:"만 10세 이상",preparation:"예약 내역",exceptions:"당일 취소 불가",benefitConditions:"평일 2인 예약 시 10% 할인, 주말 제외"};
const input={category:"offline",title:"나들이 조건 검증 공방",shortDescription:"인원과 준비물을 확인하는 체험",description:"예약 인원과 준비물을 확인하는 공방 안내 테스트입니다.",region:"울산",address:"울산 중구",tags:["놀러가자","조건검증임시"],extra:{businessUrl:"https://example.com/",benefits:"discount",links:[],play}};
const parsed=parsePostInput(input);assert(parsed.ok);assert.deepEqual(parsed.data.extra.play,play);const validated=parsed.data;
for(const changes of [{minPeople:7,maxPeople:6},{minPeople:0},{maxPeople:1.5},{solo:"yes",minPeople:2},{cost:"invalid"},{benefitConditions:""},{costDetails:""},{subtype:"호텔·리조트"},{preparation:"x".repeat(301)}])assert(!parsePostInput({...input,extra:{...input.extra,play:{...play,...changes}}}).ok,JSON.stringify(changes));
assert(parsePostInput({...input,extra:{...input.extra,play:undefined}}).ok,'legacy posts stay valid');
assert(!matchesPlayConditions(undefined,{cost:"allFree"}));assert(!matchesPlayConditions({...play,cost:"entryFree"},{cost:"allFree"}));assert(!matchesPlayConditions(play,{visit:"walkin"}));
assert.equal(filterPlayPlaces(PLAY_PLACES,{region:"울산",conditions:{cost:"entryFree",visit:"walkin"}},"2026-11-11")[0].slug,"taehwagang-garden");
assert.equal(filterPlayPlaces(PLAY_PLACES,{conditions:{cost:"allFree"}},"2026-11-11").length,0);
assert.deepEqual(readPlayConditionFilters({kind:"명소·산책",subtype:"호텔·리조트",cost:"garbage"}),{kind:"명소·산책"});
async function persistence(){
 const cwd=process.cwd();const testDir=fs.mkdtempSync(path.join(cwd,"tmp/play-conditions-store-"));process.chdir(testDir);
 try{const {localStore}=await import("../src/lib/store/local");
 const first=await localStore.createPost("test-only",validated,null);
 const second=await localStore.createPost("test-only",{...validated,title:"두 번째 조건 검증",extra:{...validated.extra,play:{...play,visit:"walkin"}}},null);
 await localStore.createPost("test-only",{...validated,title:"기존 글 조건 미등록",extra:{businessUrl:"https://example.com/"}},null);
 const filtered=await localStore.listPosts({tag:"조건검증임시",play:{visit:"reservation",cost:"paid"},pageSize:1,page:1});assert.equal(filtered.total,1);assert.equal(filtered.items[0].id,first.id);
 const changed={...play,minPeople:3,preparation:"예약 확인증과 운동화"};await localStore.updatePost(second.id,{...validated,extra:{...validated.extra,play:changed}});assert.deepEqual((await localStore.getPost(second.id))?.extra.play,changed);
 const disk=JSON.parse(fs.readFileSync(path.join(testDir,'.data/db.json'),'utf8'));assert.equal(disk.posts.find((p:{id:number})=>p.id===second.id).extra.play.minPeople,3);
 }finally{process.chdir(cwd);}
 console.log('Conditions passed: invalid/mismatched inputs rejected, free scope separated, filters before pagination, legacy compatibility, create/update persisted in isolated local store.');
}
persistence().catch(e=>{console.error(e);process.exitCode=1;});
const changedKind=parsePostInput({...input,tags:['놀러가자','명소·산책'],extra:{...input.extra,benefits:'free',play}});assert(changedKind.ok);assert.deepEqual(changedKind.data.extra.benefits,['discount']);assert(changedKind.data.tags.includes('체험·놀거리'));assert(!changedKind.data.tags.includes('명소·산책'));
