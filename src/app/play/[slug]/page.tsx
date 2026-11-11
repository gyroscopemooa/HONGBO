import { PlayVisitGuide } from "@/components/PlayVisitGuide";
import { PLAY_LOCATIONS } from "@/data/play-locations";

import { PlayConditionsSummary } from "@/components/PlayConditionsSummary";
import { playMetadata, playDetailSchema } from "@/lib/play-seo";
import { playRegion } from "@/data/play-regions";
import { PlayJsonLd } from "@/components/PlayJsonLd";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PLAY_PLACES } from "@/data/play";
import { playPeriod, playStatus, koreanDay, sortPlayPlaces } from "@/lib/play";
import { PlayEventStatus } from "@/components/PlayEventStatus";
import { PlayVisual } from "@/components/PlayVisual";
import { playPhoto } from "@/data/play-photos";
import { CopyLinkButton } from "@/components/CopyLinkButton";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = PLAY_PLACES.find(p=>p.slug===slug);
  if (!p) notFound();
  return playMetadata(p);
}
export default async function PlayDetail({ params }: Props) {
  const { slug } = await params;
  const p = PLAY_PLACES.find(p=>p.slug===slug);
  if (!p) notFound();
  const day = koreanDay();
  const photo = playPhoto(p.slug);
  const region = playRegion(p.region);
  const related = sortPlayPlaces(PLAY_PLACES.filter(x=>x.slug!==p.slug && playStatus(x, day)!=="종료" && (x.region===p.region || x.kind===p.kind)),day).slice(0,3);
  return <><PlayJsonLd data={playDetailSchema(p)}/><nav aria-label="현재 위치" className="play-muted mb-4"><Link href="/play">놀러가자</Link>{region && <> / <Link href={`/play/region/${region.slug}`}>{region.name}</Link></>} / {p.title}</nav><Link href="/play#explore" className="play-muted">← 놀러가자 전체 안내</Link><div className="play-detail"><article>
    <span className="play-badge">{p.region} · {p.kind}</span><h1>{p.title}</h1><p className="play-muted mb-6">{p.summary}</p>
    <PlayConditionsSummary conditions={p.conditions} price={p.price}/>
    <PlayEventStatus place={p} initialDay={day} notice/>
    {p.schedulePending && <p className="play-note mb-5"><strong>일정 확인 중</strong><br/>{p.scheduleNote} 아래 날짜는 제공받은 참고 일정이며 확정된 개최 안내가 아닙니다.</p>}
    <div className="play-detail-art"><PlayVisual place={p} eager/></div><p className="play-muted mt-2 !text-xs">{photo ? `${photo.caption ?? "실제 장소 자료사진 · 실시간 모습이 아닙니다."} ${photo.fit === "contain" ? "" : photo.captured ? `촬영 ${photo.captured}` : "촬영일 미확인"}` : "장소의 분위기를 표현한 일러스트입니다."}</p>
    <PlayVisitGuide conditions={p.conditions} address={p.address} region={p.area} title={p.title} location={PLAY_LOCATIONS[p.slug]}/>
    {p.slug==="gyeonggi-rice-dessert-2026" && <p className="play-muted text-sm">교통·요금 출처: <a className="underline" href="https://suwonmesse.com/facilities_guide/parking/" target="_blank" rel="noopener noreferrer">수원메쎄 공식 주차 안내</a> · 2026-11-11 확인</p>}
    {p.slug==="ulsan-culture-expo-2026" && <p className="play-muted text-sm">교통 출처: <a className="underline" href="https://www.uctf.or.kr/facility/ueco/location?lang=en" target="_blank" rel="noopener noreferrer">울산문화관광재단 UECO 오시는 길</a> · 2026-11-11 확인</p>}
    <h2>이렇게 즐겨보세요</h2><p className="play-muted">{p.companions.join(" · ")} 나들이를 생각하고 있다면, 아래 확인 사항과 공식 안내를 참고해 일정을 잡아보세요.</p>
    {p.guide && <p className="play-muted mt-3">{p.guide}</p>}
    <h2>가기 전에 확인할 것</h2><ol className="list-decimal pl-5">{p.tips.map(t=><li key={t}>{t}</li>)}</ol>
    <div className="play-note mt-6"><strong>안내 출처 · {p.checkedAt} 확인</strong><p className="mt-2"><a href={p.source} target="_blank" rel="noopener noreferrer" className="underline">{p.sourceLabel} ↗</a></p><p className="mt-2">더홍보가 위 출처와 제공 자료를 참고해 정리한 안내입니다. 실시간 예약 가능 여부·할인 확정 정보나 이용 후기는 아닙니다.</p><Link href="/contact" className="mt-2 inline-block underline">정보 수정 요청하기</Link></div>
  </article><aside className="play-aside"><span className="play-eyebrow">PLAN YOUR DAY</span><dl><dt>위치</dt><dd>{p.address}</dd><dt>비용</dt><dd>{p.price}</dd><dt>일정</dt><dd>{playPeriod(p)}{p.startDate && <PlayEventStatus place={p} initialDay={day}/>}</dd><dt>함께 가기</dt><dd>{p.companions.join(" · ")}</dd></dl><div className="mt-6"><a className="play-button" href={p.source} target="_blank" rel="noopener noreferrer">{p.kind === "축제·행사" ? "행사 안내 확인 ↗" : "여행지 안내 확인 ↗"}</a>{p.benefitUrl && <a className="play-button secondary" href={p.benefitUrl} target="_blank" rel="noopener noreferrer">요금·혜택 확인 ↗</a>}<a className="play-button secondary" href={`https://map.naver.com/p/search/${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer">지도에서 위치 검색 ↗</a><div className="mt-4"><CopyLinkButton path={`/play/${p.slug}`} /></div></div></aside></div>
    {related.length>0 && <section className="play-section"><div className="play-heading"><h2>다음으로 살펴볼 곳</h2></div><div className="play-grid">{related.map(r=><Link key={r.slug} href={`/play/${r.slug}`} className="play-card"><div className="play-card-art"><PlayVisual place={r}/></div><div className="play-card-body"><span className="play-muted">{r.region} · {r.kind}</span><h3>{r.title}</h3><PlayConditionsSummary conditions={r.conditions} price={r.price} compact/><p className="play-period">{playPeriod(r)}</p></div></Link>)}</div></section>}
  </>;
}
