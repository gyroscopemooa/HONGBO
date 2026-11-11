import type { Metadata } from "next";
import Link from "next/link";
import { PLAY_PLACES } from "@/data/play";
import { PLAY_DATE_THEMES, PLAY_DATE_SLUGS } from "@/data/play-dates";
import { PlayVisual } from "@/components/PlayVisual";
import { PlayConditionsSummary } from "@/components/PlayConditionsSummary";
import { PlayJsonLd } from "@/components/PlayJsonLd";
import { playListSchema, playBreadcrumbs } from "@/lib/play-seo";
export const metadata: Metadata = {
 title:"커플 데이트 명소 추천 8곳 · 울산·부산·경주·포항·서울·대구 | 놀러가자",
 description:"산책, 야경·전망, 체험으로 고르는 커플 데이트 명소 8곳. 추천 이유와 제안 코스, 비용·예약·방문 전 확인사항을 함께 살펴보세요.",
 alternates:{canonical:"/play/dates"},
 openGraph:{title:"둘이 떠나는 데이트 명소 | 놀러가자",description:"두 사람의 취향에 맞춰 고르는 산책·야경·체험 데이트",url:"/play/dates",images:[{url:"/play/sky-capsule.jpg",width:1280,height:960,alt:"부산 해운대 스카이캡슐"}]},
 twitter:{card:"summary_large_image",title:"커플 데이트 명소 추천 | 놀러가자",images:["/play/sky-capsule.jpg"]}
};
export default function PlayDatesPage(){
 const places=PLAY_DATE_SLUGS.map(slug=>PLAY_PLACES.find(p=>p.slug===slug)!);
 return <>
 <PlayJsonLd data={playListSchema("커플 데이트 명소 추천", "/play/dates", places)}/>
 <PlayJsonLd data={playBreadcrumbs([{name:"놀러가자",path:"/play"},{name:"커플 데이트 추천",path:"/play/dates"}])}/>
 <nav aria-label="현재 위치" className="play-muted mb-5"><Link href="/play">놀러가자</Link> / 커플 데이트 추천</nav>
 <section className="play-hero"><div className="play-hero-copy"><span className="play-eyebrow">A DAY FOR TWO</span><h1>어디 갈까?<br/>둘이 좋아할 곳으로.</h1><p>산책부터 야경, 함께하는 체험까지.<br/>두 사람의 취향에 맞는 하루를 골라보세요.</p><div className="play-hero-links"><a href="#date-walk" className="play-button">산책 데이트</a><a href="#date-view" className="play-button secondary">야경·전망</a><a href="#date-experience" className="play-button secondary">체험 데이트</a></div></div><PlayVisual place={places.find(p=>p.slug==='blueline-park')!} eager className="play-hero-art"/></section>
 <p className="play-muted mt-5">운영자가 장소 특성을 바탕으로 제안한 코스입니다. 이용 후기·인기 순위가 아니며, 소요시간은 걷는 속도와 대기 상황에 따라 달라집니다.</p>
 {PLAY_DATE_THEMES.map(theme=><section key={theme.id} id={`date-${theme.id}`} className="play-section"><div className="play-heading"><div><h2>{theme.name}</h2><p className="play-muted mt-2">{theme.description}</p></div></div><div className="play-grid">{theme.picks.map(pick=>{const place=places.find(p=>p.slug===pick.slug)!;return <article key={pick.slug} className="play-card" data-date-place={pick.slug}><Link href={`/play/${pick.slug}`} className="play-card-art block"><PlayVisual place={place}/></Link><div className="play-card-body"><span className="play-eyebrow !tracking-normal">{place.region} · {place.area}</span><h3><Link href={`/play/${pick.slug}`}>{place.title}</Link></h3><p>{pick.reason}</p><p className="!font-semibold !text-[#1762e8]">제안 코스 · {pick.plan}</p><PlayConditionsSummary conditions={place.conditions} price={place.price} compact/><p>{pick.tip}</p><Link href={`/play/${pick.slug}`} className="mt-4 inline-block text-sm font-bold">위치·비용·공식 안내 보기 →</Link></div></article>})}</div></section>)}
 <section className="play-invite"><div><h2>축제와 함께, 더 특별한 데이트</h2><p className="play-muted">방문 날짜가 정해졌다면 다가오는 축제도 함께 확인하세요.</p></div><Link href="/play#festivals" className="play-button">다가오는 축제 보기 →</Link></section>
 <p className="play-muted mt-5">직접 다녀온 좋은 장소가 있나요? <Link href="/play/share" className="underline font-bold">일반 회원도 로그인 후 무료로 공유할 수 있어요.</Link></p>
 </>;
}
