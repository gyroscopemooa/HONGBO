import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PLAY_PLACES } from "@/data/play";
import { playPeriod, playStatus } from "@/lib/play";
import { PlayVisual } from "@/components/PlayVisual";
import { playPhoto } from "@/data/play-photos";
import { CopyLinkButton } from "@/components/CopyLinkButton";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = PLAY_PLACES.find(p=>p.slug===slug);
  if (!p) notFound();
  return { title: `${p.title} | 놀러가자`, description: p.summary, alternates: { canonical: `/play/${slug}` }, openGraph: { title: p.title, description: p.summary, url: `/play/${slug}` } };
}
export default async function PlayDetail({ params }: Props) {
  const { slug } = await params;
  const p = PLAY_PLACES.find(p=>p.slug===slug);
  if (!p) notFound();
  const status = playStatus(p);
  const related = PLAY_PLACES.filter(x=>x.slug!==p.slug && playStatus(x)!=="종료" && (x.region===p.region || x.kind===p.kind)).slice(0,3);
  return <><Link href="/play#explore" className="play-muted">← 놀러가자 전체 안내</Link><div className="play-detail"><article>
    <span className="play-badge">{p.region} · {p.kind} · {status}</span><h1>{p.title}</h1><p className="play-muted mb-6">{p.summary}</p>
    {status==="종료" && <p className="play-note mb-5">종료된 행사입니다. 이 날짜는 지난 행사 기록이며 다음 회차 일정은 아직 안내하지 않습니다.</p>}
    <div className="play-detail-art"><PlayVisual place={p} eager/></div><p className="play-muted mt-2 !text-xs">{playPhoto(p.slug) ? `실제 장소 자료사진 · 촬영 ${playPhoto(p.slug)!.captured} · 실시간 모습이 아닙니다.` : "장소의 분위기를 표현한 일러스트입니다."}</p>
    <h2>이렇게 즐겨보세요</h2><p className="play-muted">{p.companions.join(" · ")} 나들이를 생각하고 있다면, 아래 확인 사항과 공식 안내를 참고해 일정을 잡아보세요.</p>
    <h2>가기 전에 확인할 것</h2><ol className="list-decimal pl-5">{p.tips.map(t=><li key={t}>{t}</li>)}</ol>
    <div className="play-note mt-6"><strong>안내 출처 · {p.checkedAt} 확인</strong><p className="mt-2"><a href={p.source} target="_blank" rel="noopener noreferrer" className="underline">{p.sourceLabel} ↗</a></p><p className="mt-2">더홍보가 공식 자료를 참고해 정리한 안내입니다. 실시간 예약 가능 여부·할인 확정 정보나 이용 후기는 아닙니다.</p><Link href="/contact" className="mt-2 inline-block underline">정보 수정 요청하기</Link></div>
  </article><aside className="play-aside"><span className="play-eyebrow">PLAN YOUR DAY</span><dl><dt>위치</dt><dd>{p.address}</dd><dt>비용</dt><dd>{p.price}</dd><dt>일정</dt><dd>{playPeriod(p)}{p.startDate && <span className={`play-status ml-2 ${status === "종료" ? "ended" : ""}`}>{status}</span>}</dd><dt>함께 가기</dt><dd>{p.companions.join(" · ")}</dd></dl><div className="mt-6"><a className="play-button" href={p.source} target="_blank" rel="noopener noreferrer">공식 안내 확인 ↗</a>{p.benefitUrl && <a className="play-button secondary" href={p.benefitUrl} target="_blank" rel="noopener noreferrer">요금·혜택 확인 ↗</a>}<a className="play-button secondary" href={`https://map.naver.com/p/search/${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer">지도에서 위치 검색 ↗</a><div className="mt-4"><CopyLinkButton path={`/play/${p.slug}`} /></div></div></aside></div>
    {related.length>0 && <section className="play-section"><div className="play-heading"><h2>다음으로 살펴볼 곳</h2></div><div className="play-grid">{related.map(r=><Link key={r.slug} href={`/play/${r.slug}`} className="play-card"><div className="play-card-art"><PlayVisual place={r}/></div><div className="play-card-body"><span className="play-muted">{r.region} · {r.kind}</span><h3>{r.title}</h3><p className="play-period">{playPeriod(r)}</p></div></Link>)}</div></section>}
  </>;
}
