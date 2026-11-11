import { PLAY_LATEST_FESTIVALS } from "@/data/play-festivals-latest";
import { PlayFreshFestivals } from "@/components/PlayFreshFestivals";

import { PlayConditionsSummary } from "@/components/PlayConditionsSummary";
import { PLAY_REGIONS } from "@/data/play-regions";
import { PLAY_TOURISM } from "@/data/play-tourism";
import { PlayJsonLd } from "@/components/PlayJsonLd";
import { playListSchema } from "@/lib/play-seo";
import type { Metadata } from "next";
import Link from "next/link";
import { PlayVisual } from "@/components/PlayVisual";
import { PlayBanner } from "@/components/PlayBanner";
import { PlayFestivalCalendar } from "@/components/PlayFestivalCalendar";
import { PlayExplorer } from "@/components/PlayExplorer";
import { PlaySharedCard } from "@/components/PlaySharedCard";
import { PLAY_PLACES } from "@/data/play";
import { PLAY_TAG, koreanDay } from "@/lib/play";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "국내 가볼 만한 곳·축제 일정·데이트·가족 나들이 | 놀러가자",
  description: "일상 가까운 작은 여행. 국내 명소, 테마파크, 축제, 숙소와 이용 혜택을 찾아보고 좋은 장소를 공유하세요.",
  alternates: { canonical: "/play" },
  openGraph: { title: "놀러가자 | 더홍보", description: "이번 주말, 좋은 시간을 발견하세요.", url: "/play", images: [{url:"/play/haeundae.jpg",width:1280,height:960,alt:"부산 해운대 바다"}] },
  twitter: {card:"summary_large_image",title:"국내 여행지·축제 일정 | 놀러가자",description:"지역별 명소와 축제 일정, 데이트·가족 나들이 안내를 살펴보세요.",images:["/play/haeundae.jpg"]},
};

export default async function PlayPage() {
  const posts = await store.listPosts({ publicOnly: true, isSeed: false, tag: PLAY_TAG, pageSize: 6, sort: "latest" }).catch(()=>null);
  return <>
    <PlayJsonLd data={playListSchema("국내 여행지·축제 안내", "/play", PLAY_PLACES)}/>
    <section className="play-hero"><div className="play-hero-copy"><span className="play-eyebrow">이번 주말 어디 가지?</span><h1>갈 곳 고민은 끝.<br/>오늘은 놀러가자<span>.</span></h1><p>최신 축제부터 데이트·가족 나들이까지,<br/>공식 안내로 확인한 일정만 가볍게 골라보세요.</p><div className="play-hero-links"><a href="#explore" className="play-button">지금 갈 곳 찾기 ↗</a><a href="#shared" className="play-button secondary">이용자 추천 소식</a></div></div><PlayVisual place={PLAY_PLACES.find(p=>p.slug==="haeundae")!} eager className="play-hero-art"/></section>
    <div className="flex flex-wrap gap-x-7 gap-y-2 border-b border-[#d9e6f8] py-5 text-xs font-semibold text-[#59769a]"><span>✳ 국내부터 차근차근</span><span>↗ 공식 안내로 한 번 더 확인</span><span>♡ 작은 가게부터 큰 여행지까지</span></div>
    <nav className="play-chips" aria-label="놀러가자 바로가기"><a className="play-chip" href="#explore">지역·종류·이용 조건</a><a className="play-chip" href="#new-festivals">새로 더한 축제</a><a className="play-chip" href="#festivals">축제 달력</a><Link className="play-chip" href="/play/dates">커플 데이트 추천</Link><a className="play-chip" href="#regional-guides">지역별 여행</a></nav>
    <PlayBanner/>
    <PlayFreshFestivals places={PLAY_PLACES.filter(p=>PLAY_LATEST_FESTIVALS.some(f=>f.slug===p.slug))} initialDay={koreanDay()}/>
    <section className="play-invite" id="date-recommendations"><div><p className="play-eyebrow mb-2">A DAY FOR TWO</p><h2>커플 데이트, 오늘은 어디로?</h2><p className="play-muted">울산·부산·경주·포항부터 서울·대구까지.<br/>산책·야경·체험 명소 8곳과 둘이 즐기는 코스를 골라보세요.</p></div><Link href="/play/dates" className="play-button shrink-0">데이트 명소 추천 보기 →</Link></section>
    <PlayExplorer places={PLAY_PLACES} day={koreanDay()}/>
    <section className="play-section" id="regional-guides"><div className="play-heading"><div><p className="play-eyebrow">NEARBY GETAWAYS</p><h2 className="mt-2">지역별로 찾아보는 국내 여행</h2></div></div><div className="play-grid">{PLAY_REGIONS.map(r=><Link key={r.slug} href={`/play/region/${r.slug}`} className="play-card"><div className="play-card-art"><PlayVisual place={PLAY_PLACES.find(p=>p.slug===r.hero)!}/></div><div className="play-card-body"><h3>{r.name} 가볼 만한 곳 →</h3><p>{r.description}</p></div></Link>)}</div></section>
    <section className="play-section" aria-label="새로 더한 여행지"><div className="play-heading"><h2>새로 더한 여행지</h2></div><p className="play-muted mb-5">한국관광공사 대한민국 구석구석 안내를 참고해 정리했습니다. 장소별 사진과 방문 팁, 원문 출처를 함께 확인하세요.</p><div className="play-grid">{PLAY_PLACES.filter(p=>PLAY_TOURISM.some(t=>t.slug===p.slug)).map(p=><Link className="play-card" key={p.slug} href={`/play/${p.slug}`}><div className="play-card-art"><PlayVisual place={p}/></div><div className="play-card-body"><span className="play-eyebrow">{p.region} · {p.area}</span><h3>{p.title}</h3><p>{p.summary}</p><PlayConditionsSummary conditions={p.conditions} price={p.price} compact/></div></Link>)}</div></section>
    <PlayFestivalCalendar places={PLAY_PLACES} initialDay={koreanDay()}/>
    <section id="shared" className="play-section"><div className="play-heading"><div><p className="play-eyebrow">SHARED BY OUR COMMUNITY</p><h2 className="mt-2">함께 나누는 장소와 소식</h2></div><Link href="/play/shared" className="text-sm font-bold">모두 보기 →</Link></div><p className="play-muted mb-5">이용자·업체가 직접 올리는 공개 홍보입니다. 행사 기간과 혜택 조건은 각 글에서 확인하세요.</p>
      {posts?.items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.items.map(p=><PlaySharedCard key={p.id} post={p}/>)}</div> : <div className="play-empty"><h3 className="text-xl font-bold">{posts ? "좋은 곳을 아는 당신의 첫 소식을 기다려요" : "공유 소식을 불러오지 못했어요"}</h3><p className="play-muted mt-3">{posts ? "동네 사진관, 공방, 펜션, 축제 소식까지. 나들이가 되는 곳이라면 알려주세요." : "잠시 후 다시 방문해주세요. 위의 장소 안내는 계속 볼 수 있어요."}</p><Link href="/play/share" className="play-button mt-5">장소·소식 공유하기</Link></div>}
    </section>
    <section className="play-invite"><div><p className="play-eyebrow mb-2">FOR EVERY GOOD PLACE</p><h2>작은 가게에도, 놀러 갈 이유는 있으니까.</h2><p className="play-muted">사진 한 장의 추억, 새로운 체험, 하루의 쉼.<br/>사장님도 여행자도 더홍보 계정으로 무료로 공유하세요.</p></div><Link href="/play/share" className="play-button shrink-0">우리 동네 좋은 곳 알리기 ↗</Link></section>
    <p className="play-muted mt-6 !text-xs">공식 자료를 참고한 편집 안내와 회원 홍보를 구분해 제공합니다. 예약·결제는 각 업체에서 진행하며, 요금·영업일·혜택은 방문 전 공식 안내를 확인하세요.</p>
  </>;
}
