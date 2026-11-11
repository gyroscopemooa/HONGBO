import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { Pagination } from "@/components/Pagination";
import { PLAY_TAG } from "@/lib/play";
import { REGIONS } from "@/lib/constants";
import { parseListParams, buildHref, type SearchParams } from "@/lib/listing";
import { store } from "@/lib/store";

export const metadata: Metadata = { title: "함께 나누는 장소와 소식 | 놀러가자", alternates: { canonical: "/play/shared" }, robots: { index: false, follow: true } };
export default async function SharedPlayPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const p = parseListParams(await searchParams);
  const result = await store.listPosts({ publicOnly:true, isSeed:false, tag:PLAY_TAG, region:p.region, q:p.q, page:p.page, pageSize:12, sort:"latest" }).catch(()=>null);
  return <section className="play-section"><Link href="/play" className="play-muted">← 놀러가자</Link><h1 className="mt-5 text-3xl font-black">함께 나누는 장소와 소식</h1><p className="play-muted mt-3">회원·업체가 직접 등록한 공개 홍보입니다. 기간과 가격은 원문에서 확인하세요.</p><form className="play-filters flex flex-wrap gap-3" action="/play/shared"><label className="min-w-40 flex-1"><span className="sr-only">공유 소식 검색</span><input name="q" type="search" defaultValue={p.q} placeholder="장소나 키워드" maxLength={60}/></label><label><span className="sr-only">지역</span><select name="region" defaultValue={p.region ?? ""}><option value="">모든 지역</option>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></label><button className="play-button" type="submit">검색</button></form>{result?.items.length ? <><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{result.items.map(post=><PostCard key={post.id} post={post}/>)}</div><Pagination page={p.page} totalPages={Math.ceil(result.total/12)} hrefFor={page=>buildHref("/play/shared",{q:p.q,region:p.region,page})}/></> : <div className="play-empty"><p>{result ? "아직 조건에 맞는 공유 소식이 없어요." : "소식을 불러오지 못했어요. 잠시 후 다시 시도해주세요."}</p><Link className="play-button mt-5" href="/play/share">장소 공유하기</Link></div>}</section>;
}
