"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PLAY_COMPANIONS, PLAY_KINDS, filterPlayPlaces, playStatus, type PlayPlace } from "@/lib/play";
import { PlayArt } from "./PlayArt";

const SAVE_KEY = "thehongbo.play.saved.v1";
export function PlayExplorer({ places, day }: { places: PlayPlace[]; day: string }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [kind, setKind] = useState("");
  const [companion, setCompanion] = useState("");
  const [ended, setEnded] = useState(false);
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
  const filtered = filterPlayPlaces(places, { q, region, kind, companion, ended }, day).filter(p => !savedOnly || saved.includes(p.slug));
  const reset = () => { setQ(""); setRegion(""); setKind(""); setCompanion(""); setEnded(false); setSavedOnly(false); };
  return <section id="explore" className="play-section">
    <div className="play-heading"><div><p className="play-eyebrow">FIND YOUR LITTLE GETAWAY</p><h2 className="mt-2">이번엔 어디로 갈까요?</h2></div><p className="play-muted">운영자가 정리한 국내 나들이 안내</p></div>
    <div className="play-filters">
      <div className="play-search-row">
        <label><span className="sr-only">장소·지역 검색</span><input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="해운대, 바다, 테마파크…" maxLength={80}/></label>
        <label><span className="sr-only">지역</span><select aria-label="지역" value={region} onChange={e=>setRegion(e.target.value)}><option value="">모든 지역</option>{Array.from(new Set(places.map(p=>p.region))).map(r=><option key={r}>{r}</option>)}</select></label>
        <label><span className="sr-only">동행</span><select aria-label="동행" value={companion} onChange={e=>setCompanion(e.target.value)}><option value="">누구와 함께?</option>{PLAY_COMPANIONS.map(c=><option key={c}>{c}</option>)}</select></label>
        <button type="button" className="play-button secondary" onClick={reset}>초기화</button>
      </div>
      <div className="play-chips" aria-label="놀거리 종류">{["", ...PLAY_KINDS].map(k=><button key={k} type="button" className="play-chip" aria-pressed={kind===k} onClick={()=>setKind(k)}>{k || "전체"}</button>)}</div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-[#62715f]">
        <label className="flex items-center gap-2"><input type="checkbox" checked={savedOnly} onChange={e=>setSavedOnly(e.target.checked)}/>이 기기에 찜한 곳 ({saved.length})</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={ended} onChange={e=>setEnded(e.target.checked)}/>지난 행사도 보기</label>
        <span className="ml-auto" aria-live="polite">{filtered.length}개의 안내</span>
      </div>
      {storageMessage && <p role="status" className="play-muted mt-3">{storageMessage}</p>}
    </div>
    {filtered.length ? <div className="play-grid">{filtered.map(p=><article className="play-card" key={p.slug}>
      <Link href={`/play/${p.slug}`} tabIndex={-1} aria-hidden="true"><div className="play-card-art"><PlayArt art={p.art}/><span className="play-badge">{playStatus(p, day)==="종료" ? "종료된 행사" : p.mood}</span></div></Link>
      <div className="play-card-body"><span className="play-eyebrow !tracking-normal">{p.region} · {p.area} <span className="font-normal">/ {p.kind}</span></span><h3><Link href={`/play/${p.slug}`}>{p.title}</Link></h3><p>{p.summary}</p><div className="play-card-bottom"><span>{p.companions.join(" · ")}</span><button type="button" className="play-save" aria-pressed={saved.includes(p.slug)} aria-label={`${p.title} ${saved.includes(p.slug) ? "찜 해제" : "찜하기"}`} onClick={()=>toggleSave(p.slug)}>{saved.includes(p.slug) ? "♥ 찜함" : "♡ 찜"}</button></div></div>
    </article>)}</div> : <div className="play-empty"><h3 className="text-xl font-bold">조건에 맞는 안내가 아직 없어요</h3><p className="play-muted mt-3">다른 지역이나 종류를 선택해보세요. 알고 있는 곳을 직접 공유해도 좋아요.</p><button type="button" onClick={reset} className="play-button secondary mt-5">전체 안내 보기</button></div>}
    <p className="play-muted mt-5 !text-xs">카드 그림은 장소의 분위기를 표현한 일러스트입니다. 찜은 현재 브라우저에만 저장됩니다.</p>
  </section>;
}
