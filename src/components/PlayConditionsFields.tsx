"use client";
import { EMPTY_PLAY_CONDITIONS, PLAY_CATEGORIES, PLAY_COST, PLAY_NOTICE, PLAY_SOLO, PLAY_VISIT, playSubtypes, type PlayConditions } from "@/lib/play-conditions";
export function PlayConditionsFields({value,onChange}:{value:PlayConditions;onChange:(value:PlayConditions)=>void}){
 const set=<K extends keyof PlayConditions>(key:K,v:PlayConditions[K])=>onChange({...value,[key]:v});
 const field="mt-1 w-full min-w-0 rounded-lg border border-[#d6e2f3] bg-white p-3 text-sm text-[#142b50]";
 const select=(key:"notice"|"cost"|"visit"|"solo",title:string,options:Record<string,string>)=><label className="block text-sm font-semibold">{title}<select aria-label={title} className={field} value={value[key]} onChange={e=>set(key,e.target.value as never)}>{Object.entries(options).map(([v,t])=><option value={v} key={v}>{t}</option>)}</select></label>;
 const area=(key:"costDetails"|"eligibility"|"preparation"|"exceptions"|"benefitConditions",title:string,placeholder:string,required=false)=><label className="block text-sm font-semibold">{title}<textarea className={field} rows={2} maxLength={300} value={value[key]} onChange={e=>set(key,e.target.value)} placeholder={placeholder} required={required}/></label>;
 return <section aria-label="나들이 분류와 이용 조건" className="my-5 rounded-xl border border-[#dce7f7] bg-[#f5f9ff] p-4 sm:p-5">
 <h2 className="text-lg font-bold">분류와 방문 조건</h2><p className="my-3 text-sm leading-relaxed text-[#60728c]">카드와 글 상단에 표시됩니다. 자유 방문은 예약 여부, 무료는 비용 범위입니다. 모르는 조건은 확인 필요로 남겨주세요.</p>
 <div className="grid gap-4 sm:grid-cols-2">
 <label className="block text-sm font-semibold">활동 종류<select aria-label="활동 종류" className={field} value={value.kind} onChange={e=>onChange({...value,kind:e.target.value as PlayConditions["kind"],subtype:""})}>{PLAY_CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select></label>
 <label className="block text-sm font-semibold">세부 종류<select aria-label="세부 종류" className={field} value={value.subtype} onChange={e=>set("subtype",e.target.value)}><option value="">세부 분류 미지정</option>{playSubtypes(value.kind).map(s=><option key={s}>{s}</option>)}</select></label>
 {select("notice","소식 성격",PLAY_NOTICE)}{select("cost","비용 구분",PLAY_COST)}
 </div><div className="mt-4">{area("costDetails","요금·무료 범위","예: 입장 무료, 주차·유료 체험 별도 / 1인 15,000원",value.cost!=="unknown")}</div>
 <div className="mt-4 grid gap-4 sm:grid-cols-2">{select("visit","예약·방문 방식",PLAY_VISIT)}{select("solo","혼자 참여",PLAY_SOLO)}
 <label className="block text-sm font-semibold">최소 인원 (선택)<input className={field} type="number" min={1} max={100000} step={1} value={value.minPeople??""} onChange={e=>set("minPeople",e.target.value?Number(e.target.value):undefined)} placeholder="미확인 시 비워두기"/></label>
 <label className="block text-sm font-semibold">최대 인원 (선택)<input className={field} type="number" min={value.minPeople??1} max={100000} step={1} value={value.maxPeople??""} onChange={e=>set("maxPeople",e.target.value?Number(e.target.value):undefined)} placeholder="회차·예약당 최대 인원"/></label></div>
 <div className="mt-4 grid gap-4 sm:grid-cols-2">{area("eligibility","참여 대상·연령·제한","예: 만 7세 이상, 보호자 동반 / 연령 제한 없음")}{area("preparation","준비물","예: 신분증·예약 내역·운동화 / 별도 준비물 없음")}{area("exceptions","특이사항·제외 조건","예: 우천 취소, 반려동물 제한, 주말 제외")}{area("benefitConditions","이벤트·할인·쿠폰 조건","대상, 할인 내용, 참여 방법, 사용 기한, 중복 할인·제외일",["event","discount","coupon"].includes(value.notice))}</div>
 <button type="button" className="mt-4 text-xs text-[#60728c] underline" onClick={()=>onChange({...EMPTY_PLAY_CONDITIONS,kind:value.kind})}>이 조건 입력 초기화</button>
 </section>;
}
