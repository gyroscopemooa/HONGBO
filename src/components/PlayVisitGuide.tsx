"use client";
import { useState } from "react";
import type { PlayConditions } from "@/lib/play-conditions";
import type { PlayLocation } from "@/data/play-locations";
export function PlayVisitGuide({conditions:c,address,region,title,location}:{conditions?:PlayConditions;address?:string|null;region?:string|null;title:string;location?:PlayLocation}){
 const [mapOpen,setMapOpen]=useState(false);
 const query=address?.trim();
 const weatherQuery=[region||address||title,"날씨"].join(" ");
 const link="inline-block rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800";
 const valid=location&&Number.isFinite(location.lat)&&Number.isFinite(location.lon)&&Math.abs(location.lat)<=90&&Math.abs(location.lon)<=180;
 const map=valid?`https://www.openstreetmap.org/export/embed.html?${new URLSearchParams({bbox:`${location.lon-.008},${location.lat-.005},${location.lon+.008},${location.lat+.005}`,layer:"mapnik",marker:`${location.lat},${location.lon}`})}`:undefined;
 const rows=[['내부 이용료·추가 비용',c?.extraCosts||'체험·먹거리·대여료가 입장료에 포함되는지는 확인되지 않았습니다. 이용할 항목의 가격을 현장에서 확인하세요.'],['운영시간·입장 마감',c?.operatingHours||'방문일의 운영시간·휴무·마지막 입장은 공식 안내에서 확인하세요.'],['대중교통',c?.transport||'아래 지도에서 출발지를 지정하고 대중교통 경로와 귀가 시간대의 막차를 확인하세요.'],['자가용·주차',c?.parking||'주차 요금·할인·행사장 진입 통제는 확인 필요합니다. 입장 무료가 주차 무료를 뜻하지는 않습니다.']];
 return <section aria-label="방문 실용 안내" className="my-6 min-w-0 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-slate-800 sm:p-6">
 <h2 className="!mt-0 !text-xl font-bold">비용부터 날씨까지, 방문 준비</h2>
 <dl className="mt-4 space-y-4 text-sm leading-6">{rows.map(([label,value])=><div key={label}><dt className="font-bold text-blue-900">{label}</dt><dd className="mt-1 whitespace-pre-line break-words">{value}</dd></div>)}</dl>
 <h3 className="mt-6 font-bold">위치·지도·길찾기</h3><p className="my-2 text-sm">{query||'상세 주소가 아직 등록되지 않았습니다.'}</p>
 {query&&<div className="flex flex-wrap gap-2"><a className={link} href={`https://map.naver.com/p/search/${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">네이버 지도·길찾기 ↗</a><a className={link} href={`https://map.kakao.com/?q=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">카카오 지도·길찾기 ↗</a></div>}
 {map&&<div className="mt-3"><button type="button" className={link} aria-expanded={mapOpen} onClick={()=>setMapOpen(!mapOpen)}>{mapOpen?'지도 접기':'페이지에서 지도 보기'}</button>{mapOpen&&<iframe title={`${title} 위치 지도`} src={map} loading="lazy" className="mt-3 h-64 w-full rounded-xl border-0" referrerPolicy="no-referrer"/>}<p className="mt-2 text-xs text-slate-600">{location?.label} · 정확한 입구와 행사 동선은 현장 안내를 확인하세요. <a href={location?.source||'https://www.openstreetmap.org/copyright'} target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap 기여자</a></p></div>}
 <p className="mt-2 text-xs text-slate-500">지도가 보이지 않으면 위 지도 서비스에서 주소를 검색해 주세요.</p>
 <h3 className="mt-6 font-bold">옷차림·준비물</h3><p className="mt-2 text-sm leading-6">{c?.outfit||'복장 추천: 오래 걷기 편한 신발과 기온에 맞춰 벗고 입을 수 있는 겉옷을 준비하세요. 사진 촬영은 움직임이 편한 옷에 포인트 색상 하나를 더해보세요.'}</p>{c?.preparation&&<p className="mt-2 text-sm">준비물: {c.preparation}</p>}
 <h3 className="mt-6 font-bold">방문 지역 날씨</h3><p className="my-2 text-sm leading-6">{c?.weatherNotice||'출발 전 강수·바람·체감온도와 현장 운영 공지를 함께 확인하세요. 날씨만으로 행사 취소 여부를 판단하지 마세요.'}</p><div className="flex flex-wrap gap-2"><a className={link} href={`https://search.naver.com/search.naver?query=${encodeURIComponent(weatherQuery)}`} target="_blank" rel="noopener noreferrer">지역 날씨 확인 ↗</a><a className={link} href="https://www.weather.go.kr/w/forecast/overall/short-term.do" target="_blank" rel="noopener noreferrer">기상청 예보 ↗</a></div><p className="mt-2 text-xs text-slate-500">실시간 기온 표시가 아닌 예보 확인 링크입니다. 옷차림은 참고용 추천이며 방문일 예보에 맞춰 조절하세요.</p>
 {c?.exceptions&&<p className="mt-4 rounded-lg bg-white p-3 text-sm leading-6"><strong>특이사항·안내</strong><br/>{c.exceptions}</p>}
 </section>;
}
