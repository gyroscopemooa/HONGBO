"use client";

import Link from "next/link";
import { REGIONS } from "@/lib/constants";
import { PLAY_NOTICE, PLAY_COST, PLAY_VISIT, PLAY_SOLO, playSubtypes, type PlayConditionFilters } from "@/lib/play-conditions";
import { PlayConditionsSummary } from "./PlayConditionsSummary";
import { useEffect, useState } from "react";
import { PLAY_COMPANIONS, PLAY_KINDS, filterPlayPlaces, playPeriod, playStatus, playCountdown, sortPlayPlacesBy, PLAY_SORTS, type PlaySort, type PlayPlace } from "@/lib/play";
import { PlayVisual } from "./PlayVisual";
import { usePlayDay } from "./usePlayDay";
import { CalendarDays } from "lucide-react";

const SAVE_KEY = "thehongbo.play.saved.v1";
export function PlayExplorer({ places, day: initialDay }: { places: PlayPlace[]; day: string }) {
  const day = usePlayDay(initialDay);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [kind, setKind] = useState("");
  const [conditions, setConditions] = useState<PlayConditionFilters>({});
  const [companion, setCompanion] = useState("");
  const [sort, setSort] = useState<PlaySort>("default");
  const [expanded, setExpanded] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [storageMessage, setStorageMessage] = useState("");
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate browser-local preferences
      if (Array.isArray(value)) setSaved(value.filter((v): v is string => typeof v === "string"));
    } catch { /* Browsing is still available if storage is disabled. */ }
  }, []);
  function toggleSave(slug: string) {
    const next = saved.includes(slug) ? saved.filter(s => s !== slug) : [...saved, slug];
    setSaved(next);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); setStorageMessage(""); }
    catch { setStorageMessage("이 브라우저에서는 찜을 보관할 수 없어 현재 화면에서만 유지돼요."); }
  }
  const filtered = sortPlayPlacesBy(filterPlayPlaces(places, { q, region, kind, companion, conditions, ended: sort === "past" }, day), sort, day).filter(p => !savedOnly || saved.includes(p.slug));
  const reset = () => { setQ(""); setRegion(""); setKind(""); setCompanion(""); setSavedOnly(false); setSort("default"); setConditions({}); setExpanded(false); };
  return <section id="explore" className="play-section">
    <div className="play-heading"><div><p className="play-eyebrow">FIND YOUR LITTLE GETAWAY</p><h2 className="mt-2">지역·종류·조건으로 찾아보기</h2></div><p className="play-muted">운영자가 정리한 국내 나들이 안내</p></div>
    <div className="play-filters">
      <div className="play-search-row">
        <label><span className="sr-only">장소·지역 검색</span><input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="해운대, 바다, 테마파크…" maxLength={80}/></label>
        <label><span className="sr-only">지역</span><select aria-label="지역" value={region} onChange={e=>setRegion(e.target.value)}><option value="">전국 · 모든 지역</option>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></label>
        <label><span className="sr-only">동행</span><select aria-label="동행" value={companion} onChange={e=>setCompanion(e.target.value)}><option value="">누구와 함께?</option>{PLAY_COMPANIONS.map(c=><option key={c}>{c}</option>)}</select></label>
        <button type="button" className="play-button secondary" onClick={reset}>초기화</button>
      </div>
      <div className="play-chips" aria-label="놀거리 종류">{["", ...PLAY_KINDS].map(k=><button key={k} type="button" className="play-chip" aria-pressed={kind===k} onClick={()=>{setKind(k);setConditions({...conditions,subtype:undefined});}}>{k || "전체"}</button>)}</div>
      {kind && <div className="play-chips" aria-label="세부 활동 종류">{["",...playSubtypes(kind)].map(t=><button type="button" className="play-chip" key={t} aria-pressed={(conditions.subtype??"")===t} onClick={()=>setConditions({...conditions,subtype:t})}>{t||"세부 종류 전체"}</button>)}</div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{([['notice','소식 성격',PLAY_NOTICE],['cost','비용',PLAY_COST],['visit','방문 방식',PLAY_VISIT],['solo','혼자 참여',PLAY_SOLO]] as const).map(([key,title,options])=><label className="text-xs font-semibold" key={key}>{title}<select className="mt-1" aria-label={title} value={conditions[key]??""} onChange={e=>setConditions({...conditions,[key]:e.target.value||undefined})}><option value="">전체</option>{Object.entries(options).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>)}</div>
      <p className="play-muted mt-3 !text-xs">입장 무료와 전체 이용 무료, 자유 방문과 1인 참여는 서로 다른 조건입니다. 확인된 조건만 필터에 반영합니다.</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-[#5e7390]">
        <label className="flex items-center gap-2"><input type="checkbox" checked={savedOnly} onChange={e=>setSavedOnly(e.target.checked)}/>이 기기에 찜한 곳 ({saved.length})</label>
        <Link href="/play/archive" className="font-bold underline">지난 축제 기록 →</Link>
        <span className="ml-auto" aria-live="polite">{filtered.length}개의 안내</span>
      </div>
      {storageMessage && <p role="status" className="play-muted mt-3">{storageMessage}</p>}
    </div>
    <div className="play-chips mt-4" role="group" aria-label="정렬">{PLAY_SORTS.map(o=><button key={o.id} type="button" className="play-chip" aria-pressed={sort===o.id} onClick={()=>{setSort(o.id);setExpanded(false);}}>{o.label}</button>)}</div>
    {filtered.length ? <div className="play-grid">{(expanded ? filtered : filtered.slice(0,9)).map(p=><article className="play-card" key={p.slug}>
      <Link href={`/play/${p.slug}`} tabIndex={-1} aria-hidden="true"><div className="play-card-art"><PlayVisual place={p}/><span className="play-badge">{p.startDate ? playCountdown(p, day) : p.mood}</span></div></Link>
      <div className="play-card-body"><span className="play-eyebrow !tracking-normal">{p.region} · {p.area} <span className="font-normal">/ {p.kind}</span></span><h3><Link href={`/play/${p.slug}`}>{p.title}</Link></h3><p>{p.summary}</p><PlayConditionsSummary conditions={p.conditions} price={p.price} compact/><div className="play-period"><CalendarDays size={16} aria-hidden/><span>{playPeriod(p)}</span></div>{p.startDate && <span className={`play-status ${playStatus(p, day) === "종료" ? "ended" : ""}`}>{playCountdown(p, day)}</span>}<div className="play-card-bottom"><span>{p.companions.join(" · ")}</span><button type="button" className="play-save" aria-pressed={saved.includes(p.slug)} aria-label={`${p.title} ${saved.includes(p.slug) ? "찜 해제" : "찜하기"}`} onClick={()=>toggleSave(p.slug)}>{saved.includes(p.slug) ? "♥ 찜함" : "♡ 찜"}</button></div></div>
    </article>)}</div> : <div className="play-empty"><h3 className="text-xl font-bold">조건에 맞는 안내가 아직 없어요</h3><p className="play-muted mt-3">다른 지역이나 종류를 선택해보세요. 알고 있는 곳을 직접 공유해도 좋아요.</p><button type="button" onClick={reset} className="play-button secondary mt-5">전체 안내 보기</button></div>}
    {filtered.length>9 && <button type="button" className="play-button secondary mt-5" onClick={()=>setExpanded(!expanded)}>{expanded ? "9개만 보기" : `조건에 맞는 ${filtered.length}개 모두 보기`}</button>}
    <p className="play-muted mt-5 !text-xs">행사·장소 자료사진과 주제 참고사진을 사용합니다. 촬영 시점에 따라 현재 모습과 다를 수 있습니다. 사진 출처는 아래에 표시하며, 찜은 현재 브라우저에만 저장됩니다.</p>
  </section>;
}
