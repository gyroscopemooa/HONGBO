
import { PlayConditionsSummary } from "@/components/PlayConditionsSummary";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PLAY_REGIONS } from "@/data/play-regions";
import { PLAY_PLACES } from "@/data/play";
import { playPhoto } from "@/data/play-photos";
import { koreanDay, playPeriod } from "@/lib/play";
import { playBreadcrumbs, playListSchema } from "@/lib/play-seo";
import { PlayVisual } from "@/components/PlayVisual";
import { PlayJsonLd } from "@/components/PlayJsonLd";
import { PlayFestivalCalendar } from "@/components/PlayFestivalCalendar";
type Props={params:Promise<{region:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {region}=await params;const r=PLAY_REGIONS.find(r=>r.slug===region);if(!r)notFound();const photo=playPhoto(r.hero)!;
 return {title:`${r.title} | 놀러가자`,description:r.description,alternates:{canonical:`/play/region/${r.slug}`},openGraph:{title:r.title,description:r.description,url:`/play/region/${r.slug}`,images:[{url:photo.src,width:photo.width,height:photo.height,alt:photo.alt}]},twitter:{card:"summary_large_image",title:r.title,description:r.description,images:[photo.src]}};
}
export default async function PlayRegionPage({params}:Props){
 const {region}=await params;const r=PLAY_REGIONS.find(r=>r.slug===region);if(!r)notFound();const places=PLAY_PLACES.filter(p=>p.region===r.region);const destinations=places.filter(p=>p.kind!=="축제·행사");const hero=PLAY_PLACES.find(p=>p.slug===r.hero)!;
 return <>
 <PlayJsonLd data={playListSchema(r.title,`/play/region/${r.slug}`,destinations)}/><PlayJsonLd data={playBreadcrumbs([{name:"놀러가자",path:"/play"},{name:r.name,path:`/play/region/${r.slug}`}])}/>
 <nav aria-label="현재 위치" className="play-muted mb-5"><Link href="/play">놀러가자</Link> / {r.name}</nav>
 <section className="play-hero"><div className="play-hero-copy"><p className="play-eyebrow">LOCAL TRAVEL GUIDE</p><h1 className="!text-4xl">{r.title}</h1><p>{r.intro}</p></div><div className="play-region-hero"><PlayVisual place={hero} eager className="play-hero-art"/></div></section>
 <section className="play-section"><div className="play-heading"><h2>{r.name} 여행 계획하기</h2></div><ul className="play-muted list-disc pl-5 space-y-3">{r.tips.map(t=><li key={t}>{t}</li>)}</ul></section>
 <section className="play-section"><div className="play-heading"><h2>가볼 만한 곳과 체험</h2></div><div className="play-grid">{destinations.map(p=><article key={p.slug} className="play-card"><Link className="play-card-art block" href={`/play/${p.slug}`}><PlayVisual place={p}/></Link><div className="play-card-body"><span className="play-eyebrow">{p.area} · {p.kind}</span><h3><Link href={`/play/${p.slug}`}>{p.title}</Link></h3><p>{p.summary}</p><PlayConditionsSummary conditions={p.conditions} price={p.price} compact/><p className="play-period">{playPeriod(p)}</p><Link className="mt-4 inline-block text-sm font-bold" href={`/play/${p.slug}`}>위치·방문 안내 보기 →</Link></div></article>)}</div></section>
 {places.some(p=>p.kind==="축제·행사") && <PlayFestivalCalendar places={places} initialDay={koreanDay()}/>}
 <section className="play-note mt-8"><h2 className="font-bold">안내의 기준</h2><p className="mt-2">한국관광공사·지자체·운영기관 안내를 참고한 편집 정보입니다. 장소별 상세 페이지에서 출처와 확인일을 볼 수 있습니다. 운영시간과 행사 변경사항은 방문 전 다시 확인하세요.</p><a className="underline mt-3 inline-block" href="https://korean.visitkorea.or.kr/main/main.do" target="_blank" rel="noopener noreferrer">대한민국 구석구석 여행정보 ↗</a></section>
 <nav aria-label="다른 지역 여행" className="play-chips mt-7">{PLAY_REGIONS.filter(x=>x.slug!==r.slug).map(x=><Link className="play-chip" key={x.slug} href={`/play/region/${x.slug}`}>{x.name} 여행</Link>)}</nav>
 </>;
}
