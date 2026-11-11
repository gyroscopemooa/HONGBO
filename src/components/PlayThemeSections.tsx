import Link from "next/link";
import { PLAY_THEMES } from "@/data/play-themes";
import { PlayVisual } from "./PlayVisual";
import { PlayConditionsSummary } from "./PlayConditionsSummary";
import { playPeriod, type PlayPlace } from "@/lib/play";

export function PlayThemeNav() {
  return (
    <nav className="play-chips" aria-label="테마별 바로가기">
      {PLAY_THEMES.map(t => <a key={t.id} className="play-chip" href={`#${t.id}`}>{t.title.replace(/ 추천$| 여행$| 보기 좋은 곳$| 하기 좋은 곳$/, "")}</a>)}
    </nav>
  );
}

export function PlayThemeSections({ places }: { places: PlayPlace[] }) {
  return (
    <>
      {PLAY_THEMES.map(theme => {
        const items = theme.slugs.map(s => places.find(p => p.slug === s)).filter((p): p is PlayPlace => !!p);
        if (!items.length) return null;
        return (
          <section key={theme.id} id={theme.id} className="play-section" aria-label={theme.title}>
            <div className="play-heading">
              <div><p className="play-eyebrow">{theme.eyebrow}</p><h2 className="mt-2">{theme.title}</h2></div>
              {theme.more && <Link href={theme.more.href} className="text-sm font-bold">{theme.more.label} →</Link>}
            </div>
            <p className="play-muted mb-5">{theme.description}</p>
            <div className="play-grid">
              {items.map(p => (
                <Link key={p.slug} href={`/play/${p.slug}`} className="play-card">
                  <div className="play-card-art"><PlayVisual place={p} />{p.schedulePending && <span className="play-photo-label">일정 확인 중</span>}</div>
                  <div className="play-card-body">
                    <span className="play-eyebrow !tracking-normal">{p.region} · {p.area}</span>
                    <h3>{p.title}</h3>
                    <p>{p.summary}</p>
                    <PlayConditionsSummary conditions={p.conditions} price={p.price} compact />
                    {p.startDate && <p className="play-period">{playPeriod(p)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
