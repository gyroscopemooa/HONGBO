import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PlayVisual } from "@/components/PlayVisual";
import { PlayBanner } from "@/components/PlayBanner";
import { PLAY_PLACES } from "@/data/play";
import { playPeriod, playStatus } from "@/lib/play";

export const metadata: Metadata = {
  title: "사진·일정·배너 디자인 샘플 | 놀러가자",
  robots: { index: false, follow: false },
};

export default function PlayDesignSample() {
  const festival = PLAY_PLACES.find(p => p.slug === "busan-fireworks-2026")!;
  return <section className="pb-10">
    <p className="play-eyebrow">DESIGN SAMPLE</p>
    <h1 className="mt-3 text-3xl font-black">사진과 일정으로 보는, 다음 여행.</h1>
    <p className="play-muted mt-3">실제 장소 사진을 넣은 배너와 카드입니다. 상시 장소와 기간이 있는 행사를 구분해 보여줍니다.</p>
    <div className="play-heading mt-8"><h2>사진형 여행 배너</h2></div>
    <PlayBanner/>
    <div className="play-heading mt-10"><h2>블루·화이트 장소 카드</h2></div>
    <div className="grid gap-7 lg:grid-cols-2">
      {(["blue", "white"] as const).map((theme, index) => {
        const place = PLAY_PLACES.find(p => p.slug === (index === 0 ? "haeundae" : "blueline-park"))!;
        return <article key={theme} className="overflow-hidden rounded-3xl border border-[#d9e6f8] bg-white">
          <div className={`p-7 ${theme === "blue" ? "bg-[#1762e8] text-white" : "bg-white text-[#142b50]"}`}>
            <p className="text-xs font-bold tracking-widest">{index === 0 ? "A / BLUE FIRST" : "B / WHITE FIRST"}</p>
            <h2 className="mt-4 text-2xl font-black leading-tight">{index === 0 ? "바다가 필요한 날, 해운대로." : "바다 옆, 작은 기차 여행."}</h2>
          </div>
          <div className={`p-6 ${theme === "blue" ? "bg-[#eaf3ff]" : "bg-[#f8fafc]"}`}>
            <div className="play-card">
              <Link href={`/play/${place.slug}`} className="play-card-art block"><PlayVisual place={place}/><span className="play-badge">실제 장소 사진 · 부산</span></Link>
              <div className="play-card-body"><h3><Link href={`/play/${place.slug}`}>{place.title}</Link></h3><p>{place.summary}</p><div className="play-period"><CalendarDays size={16} aria-hidden/><span>{playPeriod(place)}</span></div><div className="play-card-bottom"><span>{place.price}</span><Link href={`/play/${place.slug}`}>자세히 보기 ↗</Link></div></div>
            </div>
          </div>
        </article>;
      })}
    </div>
    <section className="mt-10 rounded-2xl border border-[#d9e6f8] bg-white p-6">
      <p className="play-eyebrow">DATED EVENT</p><h2 className="mt-3 text-2xl font-black">기간이 있는 축제는 이렇게 보여요</h2>
      <Link href={`/play/${festival.slug}`} className="mt-5 block overflow-hidden rounded-xl h-56"><PlayVisual place={festival}/></Link>
      <p className="play-muted mt-2 !text-xs">과거 부산불꽃축제 자료사진 · 2026년 행사 현장 사진이 아닙니다.</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-5 rounded-xl bg-[#edf4ff] p-5"><div><h3 className="text-lg font-bold">{festival.title}</h3><p className="play-period"><CalendarDays size={16} aria-hidden/>{playPeriod(festival)}</p><span className={`play-status ${playStatus(festival) === "종료" ? "ended" : ""}`}>{playStatus(festival)}</span></div><Link className="play-button secondary" href={`/play/${festival.slug}`}>행사 기록 보기 →</Link></div>
      <p className="play-muted mt-4">공식 발표된 실제 날짜를 사용했습니다. 여러 날 열리는 행사는 시작일 ~ 종료일로 표시하며, 지난 행사를 진행 중으로 안내하지 않습니다.</p>
    </section>
    <section className="play-section"><div className="play-heading"><h2>다른 장소도 사진으로 둘러보세요</h2></div><div className="play-grid">
      {PLAY_PLACES.filter(p => ["huinnyeoul", "lotte-world", "eworld", "busan-hotel"].includes(p.slug)).map(place => <Link key={place.slug} href={`/play/${place.slug}`} className="play-card"><div className="play-card-art"><PlayVisual place={place}/></div><div className="play-card-body"><span className="play-muted">{place.region} · {place.kind}</span><h3>{place.title}</h3><p className="play-period"><CalendarDays size={16} aria-hidden/>{playPeriod(place)}</p></div></Link>)}
    </div></section>
    <Link href="/play" className="play-button mt-6">적용된 놀러가자 보기 →</Link>
  </section>;
}
