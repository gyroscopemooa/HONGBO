export const PLAY_CATEGORIES = [
 {name:"명소·산책",subtypes:["바다·해변","공원·정원","야경·전망","역사·문화","골목·마을","숲·트레킹"]},
 {name:"축제·행사",subtypes:["빛·야경축제","불꽃·해맞이","꽃·자연축제","먹거리·지역축제","전시·박람회","공연·문화행사"]},
 {name:"테마파크",subtypes:["놀이공원","워터파크","동물원·아쿠아리움","실내 테마파크"]},
 {name:"체험·놀거리",subtypes:["공방·클래스","사진·셀프사진관","관광열차·케이블카","전망·이색체험","레저·액티비티","키즈 체험","게임·방탈출"]},
 {name:"숙소",subtypes:["호텔·리조트","펜션·풀빌라","캠핑·글램핑","한옥·게스트하우스"]},
 {name:"맛집·카페",subtypes:["맛집","카페·디저트","뷰·테마카페"]},
 {name:"전시·공연",subtypes:["미술관·박물관","팝업·전시","공연·뮤지컬","영화·상영"]},
] as const;
export type PlayKind = typeof PLAY_CATEGORIES[number]["name"];
export const PLAY_KINDS = PLAY_CATEGORIES.map(c=>c.name);
export const PLAY_NOTICE = {visit:"상시 방문",festival:"축제·행사",event:"참여 이벤트",discount:"할인 소식",coupon:"쿠폰 혜택"} as const;
export const PLAY_COST = {allFree:"전체 이용 무료",entryFree:"입장 무료 · 부대비용 별도",paid:"유료",mixed:"무료·유료 혼합",unknown:"비용 확인 필요"} as const;
export const PLAY_VISIT = {walkin:"예약 없이 자유 방문",recommended:"예약 권장",reservation:"사전 예약 필수",ticket:"입장권·예매 확인",unknown:"방문 방식 확인 필요"} as const;
export const PLAY_SOLO = {yes:"1인 참여 가능",no:"2인 이상·단체 참여",unknown:"1인 참여 확인 필요"} as const;
export interface PlayConditions {
 kind:PlayKind; subtype:string; notice:keyof typeof PLAY_NOTICE;
 cost:keyof typeof PLAY_COST; costDetails:string; visit:keyof typeof PLAY_VISIT;
 solo:keyof typeof PLAY_SOLO; minPeople?:number; maxPeople?:number;
 parkingName?:string; parkingAddress?:string; parkingAccess?:string; parkingAlternative?:string;
 extraCosts?:string; transport?:string; parking?:string; outfit?:string; weatherNotice?:string; operatingHours?:string;
 eligibility:string; preparation:string; exceptions:string; benefitConditions:string;
}
export const EMPTY_PLAY_CONDITIONS:PlayConditions={kind:"명소·산책",subtype:"",notice:"visit",cost:"unknown",costDetails:"",visit:"unknown",solo:"unknown",eligibility:"",preparation:"",exceptions:"",benefitConditions:""};
export function playSubtypes(kind:string):readonly string[]{return PLAY_CATEGORIES.find(c=>c.name===kind)?.subtypes??[];}
export type PlayConditionFilters = Partial<Pick<PlayConditions,"kind"|"subtype"|"notice"|"cost"|"visit"|"solo">>;
export function matchesPlayConditions(c:PlayConditions|undefined,f:PlayConditionFilters){return Object.entries(f).every(([k,v])=>!v||c?.[k as keyof PlayConditionFilters]===v);}
export function peopleLabel(c:PlayConditions){return c.minPeople && c.maxPeople ? `${c.minPeople}~${c.maxPeople}명` : c.minPeople ? `최소 ${c.minPeople}명` : c.maxPeople ? `최대 ${c.maxPeople}명 · 최소 인원 확인 필요` : "최소·최대 인원 확인 필요";}
export function readPlayConditionFilters(input:Record<string,string|undefined>):PlayConditionFilters{
 const result:PlayConditionFilters={};
 if(PLAY_KINDS.includes(input.kind as PlayKind)) result.kind=input.kind as PlayKind;
 if(input.subtype && PLAY_CATEGORIES.some(c=>(c.subtypes as readonly string[]).includes(input.subtype!)) && (!result.kind||playSubtypes(result.kind).includes(input.subtype)))result.subtype=input.subtype;
 for(const [key,options] of Object.entries({notice:PLAY_NOTICE,cost:PLAY_COST,visit:PLAY_VISIT,solo:PLAY_SOLO}))if(input[key] && Object.hasOwn(options,input[key]!))Object.assign(result,{[key]:input[key]});
 return result;
}
export function playBenefitValues(c:PlayConditions):string[]{return [(["event","discount","coupon"].includes(c.notice)?c.notice:""),c.cost==="allFree"?"free":""].filter(Boolean);}
