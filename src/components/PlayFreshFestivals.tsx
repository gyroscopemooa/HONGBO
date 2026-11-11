"use client";
import { useState } from "react";
import Link from "next/link";
import { PlayVisual } from "./PlayVisual";
import { PlayConditionsSummary } from "./PlayConditionsSummary";
import { usePlayDay } from "./usePlayDay";
import { sortPlayPlaces,playStatus,playCountdown,playPeriod,type PlayPlace } from "@/lib/play";
export function PlayFreshFestivals({places,initialDay}:{places:PlayPlace[];initialDay:string}){
 const day=usePlayDay(initialDay);const [expanded,setExpanded]=useState(false);
 const active=sortPlayPlaces(places.filter(p=>playStatus(p,day)!=="종료"),day);
 if(!active.length)return null;
 return <section id="new-festivals" className="play-section" aria-label="새로 더한 축제"><div className="play-heading"><div><p className="play-eyebrow">FIND YOUR NEXT FESTIVAL</p><h2 className="mt-2">어디서 뭘 할까? 새로 더한 축제</h2></div><a href="#festivals" className="text-sm font-bold">전체 축제 달력 →</a></div><p className="play-muted mb-5">불꽃·먹거리·문화행사까지, 지역과 날짜부터 확인하세요. 종료된 행사는 지난 축제에 보관합니다.</p><div className="play-grid">{active.slice(0,expanded?active.length:3).map(p=><article className="play-card" key={p.slug} data-fresh-festival={p.slug}><Link href={`/play/${p.slug}`} className="play-card-art block"><PlayVisual place={p}/><span className="play-badge">{playCountdown(p,day)}</span></Link><div className="play-card-body"><span className="play-eyebrow !tracking-normal">{p.region} · {p.area}</span><h3><Link href={`/play/${p.slug}`}>{p.title}</Link></h3><p className="play-period">{playPeriod(p)}</p><p>{p.summary}</p><PlayConditionsSummary conditions={p.conditions} price={p.price} compact/><Link href={`/play/${p.slug}`} className="mt-4 inline-block text-sm font-bold">장소·프로그램 확인 →</Link></div></article>)}</div>{active.length>3&&<button type="button" className="play-button secondary mt-5" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?"접어 보기":`새로 더한 축제 ${active.length}개 모두 보기`}</button>}</section>;
}
