import Link from "next/link";
import { PLAY_PLACES } from "@/data/play";
import { playPeriod } from "@/lib/play";
import { PlayVisual } from "./PlayVisual";

export function PlayBanner() {
  return <section className="play-banner-grid" aria-label="여행 안내 배너">
    {(["haeundae", "blueline-park"] as const).map((slug, index) => {
      const place = PLAY_PLACES.find(p => p.slug === slug)!;
      return <Link key={slug} href={`/play/${slug}`} className="play-photo-banner">
        <PlayVisual place={place}/>
        <div className="play-banner-copy"><span className="play-banner-kicker">{index === 0 ? "BUSAN / 바다 산책" : "BUSAN / 체험 나들이"}</span><h2>{index === 0 ? <>가까운 바다로,<br/>가벼운 하루 여행.</> : <>우리의 다음 정거장은<br/>바다 옆 스카이캡슐.</>}</h2><p>{playPeriod(place)}</p><span className="play-banner-cta">{index === 0 ? "해운대 나들이 안내" : "이용·예약 안내"} ↗</span></div>
      </Link>;
    })}
  </section>;
}
