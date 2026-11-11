import assert from "node:assert/strict";
import { PLAY_PLACES } from "../src/data/play";
import { PLAY_THEMES } from "../src/data/play-themes";
import { PLAY_SPOT_PLACES } from "../src/data/play-spots";
import { PLAY_LOCATIONS } from "../src/data/play-locations";
import { unknownPlayEditorialPath } from "../src/lib/play-routing";
assert.equal(new Set(PLAY_PLACES.map(p => p.slug)).size, PLAY_PLACES.length);
for (const t of PLAY_THEMES) {
  assert(t.slugs.length >= 4, t.id);
  assert.equal(new Set(t.slugs).size, t.slugs.length, t.id);
  for (const s of t.slugs) assert(PLAY_PLACES.some(p => p.slug === s), `${t.id}:${s}`);
}
for (const p of PLAY_SPOT_PLACES) {
  assert(p.tips.length >= 2 && p.guide && p.source.startsWith("https://") && p.sourceLabel && p.conditions?.subtype, p.slug);
  assert(!unknownPlayEditorialPath("/play/" + p.slug), p.slug);
  const l = PLAY_LOCATIONS[p.slug];
  if (l) assert(Math.abs(l.lat) <= 90 && Math.abs(l.lon) <= 180 && !l.source?.endsWith("/0"), p.slug);
  if (p.schedulePending) assert(p.scheduleNote, p.slug);
}
console.log(`PASS: ${PLAY_THEMES.length} theme sections, ${PLAY_SPOT_PLACES.length} spot guides, unique slugs, valid locations and routes.`);
