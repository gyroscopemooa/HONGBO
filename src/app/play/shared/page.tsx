import { PLAY_CATEGORIES, PLAY_COST, PLAY_NOTICE, PLAY_SOLO, PLAY_VISIT, readPlayConditionFilters } from "@/lib/play-conditions";
import { pickFirst } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { PlaySharedCard } from "@/components/PlaySharedCard";
import { Pagination } from "@/components/Pagination";
import { PLAY_TAG } from "@/lib/play";
import { REGIONS } from "@/lib/constants";
import { parseListParams, buildHref, type SearchParams } from "@/lib/listing";
import { store } from "@/lib/store";

export const metadata: Metadata = { title: "함께 나누는 장소와 소식 | 놀러가자", alternates: { canonical: "/play/shared" }, robots: { index: false, follow: true } };
export default async function SharedPlayPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const p = parseListParams(sp);
  const conditions = readPlayConditionFilters(Object.fromEntries(["kind","subtype","notice","cost","visit","solo"].map(k=>[k,pickFirst(sp[k])])));
  const result = await store.listPosts({ publicOnly:true, isSeed:false, tag:PLAY_TAG, region:p.region, play:conditions, q:p.q, page:p.page, pageSize:12, sort:"latest" }).catch(()=>null);
  return <section className="play-section"><Link href="/play" className="play-muted">← 놀러가자</Link><h1 className="mt-5 text-3xl font-black">함께 나누는 장소와 소식</h1><p className="play-muted mt-3">회원·업체가 직접 등록한 공개 홍보입니다. 카드에서 핵심 조건을 비교하고 상세 글에서 준비물·대상·혜택 조건을 확인하세요. 세부 조건 미등록 글은 조건 필터 결과에서 제외됩니다.</p><form className="play-filters flex flex-wrap gap-3" action="/play/shared"><label className="min-w-40 flex-1"><span className="sr-only">공유 소식 검색</span><input name="q" type="search" defaultValue={p.q} placeholder="장소나 키워드" maxLength={60}/></label><label><span className="sr-only">지역</span><select name="region" defaultValue={p.region ?? ""}><option value="">전국 · 모든 지역</option>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></label><label><span className="sr-only">활동 종류</span><select name="kind" aria-label="활동 종류" defaultValue={conditions.kind??""}><option value="">활동 종류 전체</option>{PLAY_CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select></label><label><span className="sr-only">세부 종류</span><select name="subtype" aria-label="세부 종류" defaultValue={conditions.subtype??""}><option value="">세부 종류 전체</option>{PLAY_CATEGORIES.map(c=><optgroup key={c.name} label={c.name}>{c.subtypes.map(t=><option key={t}>{t}</option>)}</optgroup>)}</select></label>{([['notice','소식 성격',PLAY_NOTICE],['cost','비용',PLAY_COST],['visit','방문 방식',PLAY_VISIT],['solo','혼자 참여',PLAY_SOLO]] as const).map(([key,title,options])=><label key={key}><span className="sr-only">{title}</span><select name={key} aria-label={title} defaultValue={conditions[key]??""}><option value="">{title} 전체</option>{Object.entries(options).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>)}<button className="play-button" type="submit">검색</button><Link href="/play/shared" className="play-button secondary">초기화</Link></form>{result?.items.length ? <><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{result.items.map(post=><PlaySharedCard key={post.id} post={post}/>)}</div><Pagination page={p.page} totalPages={Math.ceil(result.total/12)} hrefFor={page=>buildHref("/play/shared",{q:p.q,region:p.region,...conditions,page})}/></> : <div className="play-empty"><p>{result ? "아직 조건에 맞는 공유 소식이 없어요." : "소식을 불러오지 못했어요. 잠시 후 다시 시도해주세요."}</p><Link className="play-button mt-5" href="/play/share">장소 공유하기</Link></div>}</section>;
}
