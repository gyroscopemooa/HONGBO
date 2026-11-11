import { z } from "zod";
import { PLAY_CATEGORIES, PLAY_COST, PLAY_NOTICE, PLAY_SOLO, PLAY_VISIT, playSubtypes } from "./play-conditions";
const text=z.string().trim().max(300).default("");
export const playConditionsSchema=z.object({
 kind:z.enum(PLAY_CATEGORIES.map(c=>c.name)),subtype:z.string().max(40).default(""),notice:z.enum(Object.keys(PLAY_NOTICE) as (keyof typeof PLAY_NOTICE)[]),
 cost:z.enum(Object.keys(PLAY_COST) as (keyof typeof PLAY_COST)[]),costDetails:text,visit:z.enum(Object.keys(PLAY_VISIT) as (keyof typeof PLAY_VISIT)[]),solo:z.enum(Object.keys(PLAY_SOLO) as (keyof typeof PLAY_SOLO)[]),
 minPeople:z.number().int().min(1).max(100000).optional(),maxPeople:z.number().int().min(1).max(100000).optional(),
 eligibility:text,preparation:text,exceptions:text,benefitConditions:text,
}).superRefine((c,ctx)=>{
 const issue=(path:string,message:string)=>ctx.addIssue({code:"custom",path:[path],message});
 if(c.subtype&&!playSubtypes(c.kind).includes(c.subtype))issue("subtype","종류에 맞는 세부 분류를 선택해주세요.");
 if(c.minPeople&&c.maxPeople&&c.minPeople>c.maxPeople)issue("maxPeople","최대 인원은 최소 인원 이상이어야 합니다.");
 if(c.solo==="yes"&&c.minPeople&&c.minPeople>1)issue("solo","1인 참여 가능과 최소 인원이 맞지 않습니다.");
 if(c.solo==="no"&&((c.minPeople&&c.minPeople<2)||(c.maxPeople&&c.maxPeople<2)))issue("solo","단체 참여 인원을 확인해주세요.");
 if(c.cost!=="unknown"&&!c.costDetails)issue("costDetails","무료 범위·금액·별도 비용을 적어주세요.");
 if(["discount","coupon","event"].includes(c.notice)&&!c.benefitConditions)issue("benefitConditions","혜택 대상·참여 방법·제외 조건을 적어주세요.");
});
