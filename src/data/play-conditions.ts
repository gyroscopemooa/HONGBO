import { PLAY_VISIT_DETAILS } from "./play-visit-details";
import { EMPTY_PLAY_CONDITIONS, type PlayConditions } from "@/lib/play-conditions";
import type { PlayPlace } from "@/lib/play";
const subtypes:Record<string,string>={
 'taehwagang-garden':'공원·정원','daewangam-park':'바다·해변','donggung-wolji':'역사·문화','pohang-spacewalk':'전망·이색체험',haeundae:'바다·해변',huinnyeoul:'골목·마을','blueline-park':'관광열차·케이블카','lotte-world':'놀이공원',eworld:'놀이공원','busan-hotel':'호텔·리조트',
 'seoul-lantern-2026':'빛·야경축제','seomyeon-lights-2026':'빛·야경축제','haeundae-lights-2026':'빛·야경축제','suseong-lights-2026':'빛·야경축제','gwangbok-lights-2026':'빛·야경축제','gstar-2026':'전시·박람회','pohang-steel-2026':'전시·박람회','geoje-flowers-2026':'꽃·자연축제','seosan-chrysanthemum-2026':'꽃·자연축제','goheung-yuja-2026':'먹거리·지역축제','korean-sool-2026':'먹거리·지역축제','busan-fireworks-2026':'불꽃·해맞이','jangseungpo-fireworks-2026':'불꽃·해맞이','homigot-sunrise-2027':'불꽃·해맞이','christmas-busan-2026':'공연·문화행사','yuseong-christmas-2026':'공연·문화행사','gwanghwamun-market-2026':'공연·문화행사','buncheon-santa-2026':'공연·문화행사',
};
// Conditions are curated from the existing cited guides. Unknown does not imply no restriction.
const known:Record<string,Partial<PlayConditions>>={
 'taehwagang-garden':{cost:'entryFree',visit:'walkin',preparation:'산책하기 편한 신발 권장',exceptions:'안내센터·은하수길 운영시간은 정원과 별도. 강변 통제 시 현장 안내 확인.'},
 'daewangam-park':{cost:'entryFree',preparation:'해안 산책에 편한 신발 권장',exceptions:'공원과 출렁다리 운영 조건은 별도. 기상 통제·휴장 확인.'},
 'pohang-spacewalk':{cost:'entryFree',eligibility:'신장 제한·계단 보행 여건 확인',exceptions:'강우·강풍 시 출입 통제 가능'},
 'donggung-wolji':{cost:'paid',visit:'ticket',exceptions:'입장 마감과 연령·감면 조건 확인'},
 'blueline-park':{cost:'paid',visit:'ticket',exceptions:'해변열차·스카이캡슐 상품 및 출발 정거장 구분'},
 'lotte-world':{cost:'paid',visit:'ticket',eligibility:'시설별 탑승 키 제한·당일 운휴 확인'},
 eworld:{cost:'paid',visit:'ticket',eligibility:'시설별 이용 기준 확인'},
 'busan-hotel':{cost:'paid',visit:'reservation',exceptions:'추가 인원 요금·취소 마감·환불 불가 조건 확인'},
 'seoul-lantern-2026':{cost:'entryFree',preparation:'겨울 야외 방한 용품 권장',exceptions:'체험별 별도 조건 확인'},
 'christmas-busan-2026':{cost:'paid',visit:'ticket',exceptions:'목~일 및 12월 21~25일 운영 안내 확인. 전체 기간 매일 운영하는 행사 아님.'},
 'korean-sool-2026':{eligibility:'주류 시음의 연령 기준·신분증 지참 여부 확인',preparation:'신분증·이동 교통편 확인',exceptions:'음주 후 운전 금지'},
};
export function withPlayConditions(p:PlayPlace):PlayPlace{return {...p,conditions:{...EMPTY_PLAY_CONDITIONS,kind:p.kind,subtype:subtypes[p.slug]??'',notice:p.kind==='축제·행사'?'festival':'visit',costDetails:p.price,outfit:/바다|해변|불꽃|해맞이/.test(subtypes[p.slug]??p.title)?"복장 추천: 바람을 막는 겉옷과 미끄럽지 않은 운동화를 권장합니다. 야간에는 보온용 옷을 더 챙기세요.":"복장 추천: 걷기 편한 신발과 겹쳐 입을 수 있는 옷을 권장합니다. 실내외 기온 차이에 맞춰 겉옷을 조절하세요.",...known[p.slug],...p.conditions,...PLAY_VISIT_DETAILS[p.slug]}};}
