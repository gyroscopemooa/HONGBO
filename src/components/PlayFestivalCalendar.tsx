"use client";
import Link from "next/link";
import { useState } from "react";
import { PlayVisual } from "./PlayVisual";
import { usePlayDay } from "./usePlayDay";
import { playCountdown, playFestivalMonths, playMonthLabel, playPeriod, playStatus, sortPlayPlaces, type PlayPlace } from "@/lib/play";

export function PlayFestivalCalendar({places, initialDay, archived = false}: {places: PlayPlace[]; initialDay: string; archived?: boolean}) {
  const day = usePlayDay(initialDay);
  const [nearby, setNearby] = useState(false);
  const festivals = places.filter(p=>p.kind === "축제·행사" && p.startDate && (!nearby || ["부산","대구","경북","경남","울산"].includes(p.region)));
  const pending = festivals.filter(p=>p.schedulePending);
  const upcoming = sortPlayPlaces(festivals.filter(p=>playStatus(p,day)==="예정"),day);
  const ongoing = sortPlayPlaces(festivals.filter(p=>playStatus(p,day)==="진행 중"),day);
  const months = playFestivalMonths(festivals,day,archived);
  const pastCount = festivals.filter(p=>playStatus(p,day)==="종료").length;
  function card(p: PlayPlace) {
    return <article className="play-card" key={p.slug} data-festival={p.slug}><Link href={`/play/${p.slug}`} className="play-card-art block"><PlayVisual place={p}/><span className="play-badge">{playCountdown(p,day)}</span></Link><div className="play-card-body"><span className="play-eyebrow !tracking-normal">{p.region} · {p.area}</span><h3><Link href={`/play/${p.slug}`}>{p.title}</Link></h3><p>{p.summary}</p><p className="play-period">{playPeriod(p)}</p><Link href={`/play/${p.slug}`} className="mt-4 inline-block text-sm font-bold">{archived ? "지난 기록 보기" : "축제 자세히 보기"} →</Link></div></article>;
  }
  return <section id="festivals" className="play-section" aria-label="축제 일정">
    <div className="play-chips mb-4" aria-label="축제 지역 범위"><button type="button" className="play-chip" aria-pressed={!nearby} onClick={()=>setNearby(false)}>전국</button><button type="button" className="play-chip" aria-pressed={nearby} onClick={()=>setNearby(true)}>울산 근처 · 부산·대구·경북·경남</button></div>
    <nav className="play-chips mb-6" aria-label="축제 분류"><Link className="play-button secondary" href="/play#festivals" aria-current={!archived ? "page" : undefined}>다가오는 축제</Link><Link className="play-button secondary" href="/play/archive" aria-current={archived ? "page" : undefined}>지난 축제 ({pastCount})</Link></nav>
    {archived ? <><h1 className="text-3xl font-black">지난 축제 기록</h1><p className="play-muted mt-3">종료된 행사는 기록으로 보관합니다. 다음 회차 일정과 구분해서 확인해주세요.</p></> : <>
      {ongoing.length > 0 && <section className="mb-9" aria-label="진행 중인 축제"><div className="play-heading"><h2>지금 즐길 수 있는 축제</h2><p className="play-muted">종료가 가까운 순</p></div><div className="play-grid">{ongoing.map(card)}</div></section>}
      <section aria-label="곧 다가오는 축제"><div className="play-heading"><div><p className="play-eyebrow">COUNTDOWN TO GOOD DAYS</p><h2 className="mt-2">곧 다가오는 축제</h2></div><p className="play-muted">개최일이 가까운 순 · 한국시간 기준</p></div>{upcoming.length ? <div className="play-grid">{upcoming.slice(0,3).map(card)}</div> : <div className="play-empty">공식 일정이 확인된 다음 축제를 준비하고 있어요.</div>}</section>
    </>}
    {months.length > 0 && <><nav className="play-chips mt-7" aria-label="월별 축제 바로가기">{months.map(({month})=><a className="play-chip" key={month} href={`#festival-${month}`}>{playMonthLabel(month)}</a>)}</nav>{months.map(({month,items})=><section className="play-section play-month" id={`festival-${month}`} key={month}><div className="play-heading"><h2>{playMonthLabel(month)} {archived ? "지난 축제" : "축제"}</h2><p className="play-muted">{items.length}개 · {archived ? "최근 종료 순" : "이달에 열리는 축제"}</p></div><div className="play-grid">{items.map(card)}</div></section>)}</>}
    {!archived && pending.length > 0 && <section className="play-section" aria-label="일정 확인 중인 축제"><div className="play-heading"><h2>일정 확인 중인 축제</h2></div><p className="play-muted mb-5">제공받은 날짜를 참고용으로 남겼습니다. 올해 일정이 확인되기 전에는 D-day와 확정 월별 일정에 포함하지 않습니다.</p><div className="play-grid">{pending.map(card)}</div></section>}
    {archived && !months.length && <div className="play-empty mt-6">아직 지난 축제 기록이 없습니다.</div>}
  </section>;
}
