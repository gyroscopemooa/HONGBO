import Link from "next/link";
import { PlayVisual } from "./PlayVisual";
import { playPeriod, playStatus, type PlayPlace } from "@/lib/play";

/** 2027년 1월에 겹치는 축제. 일정 미확정(참고 일정)은 라벨로 구분하며 확정처럼 표시하지 않습니다. */
export function PlayJanFestivals({ places, day }: { places: PlayPlace[]; day: string }) {
  const items = places
    .filter(p => p.kind === "축제·행사" && p.startDate && (p.endDate || p.startDate) >= "2027-01-01" && p.startDate <= "2027-01-31" && playStatus(p, day) !== "종료")
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
  if (!items.length) return null;
  return (
    <section id="jan-2027" className="play-section" aria-label="2027년 1월 축제">
      <div className="play-heading"><div><p className="play-eyebrow">JANUARY 2027</p><h2 className="mt-2">2027년 1월 축제</h2></div></div>
      <p className="play-muted mb-5">새해 해맞이부터 겨울 얼음 축제까지. 일정 확인 중으로 표시된 행사는 참고 일정이니 공식 공지로 확정 여부를 확인하세요.</p>
      <div className="play-grid">
        {items.map(p => (
          <Link key={p.slug} href={`/play/${p.slug}`} className="play-card">
            <div className="play-card-art"><PlayVisual place={p} />{p.schedulePending && <span className="play-photo-label">일정 확인 중</span>}</div>
            <div className="play-card-body">
              <span className="play-eyebrow !tracking-normal">{p.region} · {p.area}</span>
              <h3>{p.title}</h3>
              <p>{p.summary}</p>
              <p className="play-period">{playPeriod(p)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
