import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PLAY_LATEST_FESTIVALS } from "../src/data/play-festivals-latest";
import { PLAY_DATE_SLUGS, PLAY_DATE_THEMES } from "../src/data/play-dates";
import { PLAY_PLACES } from "../src/data/play";
import { playPhoto } from "../src/data/play-photos";
import { playCountdown, playFestivalMonths, playStatus } from "../src/lib/play";
import { playDetailSchema } from "../src/lib/play-seo";
import { unknownPlayEditorialPath } from "../src/lib/play-routing";
assert.equal(PLAY_LATEST_FESTIVALS.length,10);
assert.equal(new Set(PLAY_PLACES.map(p=>p.slug)).size,PLAY_PLACES.length);
for(const p of PLAY_LATEST_FESTIVALS){
 assert(!p.schedulePending,p.slug);assert(p.startDate&&p.endDate&&p.startDate<=p.endDate,p.slug);
 assert.notEqual(playStatus(p,'2026-11-11'),'종료',p.slug);
 assert.equal(playStatus(p,'2026-12-01'),'종료',p.slug);
 assert.equal(playFestivalMonths([p],'2026-11-11')[0].month,'2026-11');
 assert.equal(playFestivalMonths([p],'2026-12-01').length,0);
 assert.equal(playFestivalMonths([p],'2026-12-01',true)[0].month,'2026-11');
 assert(p.conditions?.subtype&&p.tips.length>=2&&p.guide&&p.sourceLabel,p.slug);
 assert(!unknownPlayEditorialPath('/play/'+p.slug));
 const photo=playPhoto(p.slug);assert(photo&&existsSync('public'+photo.src),p.slug);
 assert(photo.label&&photo.caption&&photo.source&&photo.width>0&&photo.height>0,p.slug);
 const graph=playDetailSchema(p)['@graph'][0];
 assert('mainEntity' in graph&&graph.mainEntity?.['@type']==='Event',p.slug);
 if(photo.label.includes('참고'))assert(!graph.mainEntity?.image,p.slug);
 else assert.equal(photo.fit,'contain',p.slug);
}
assert.equal(playCountdown(PLAY_LATEST_FESTIVALS.find(p=>p.slug==='pohang-fireworks-2026')!,'2026-11-11'),'D-8');
assert.equal(PLAY_DATE_SLUGS.length,8);assert.equal(new Set(PLAY_DATE_SLUGS).size,8);
for(const theme of PLAY_DATE_THEMES)for(const pick of theme.picks){const p=PLAY_PLACES.find(p=>p.slug===pick.slug);assert(p&&p.companions.includes('데이트')&&playPhoto(p.slug));assert(pick.reason&&pick.plan&&pick.tip);}
assert(!unknownPlayEditorialPath('/play/dates'));assert(unknownPlayEditorialPath('/play/not-a-place'));
assert(readFileSync('src/app/sitemap.ts','utf8').includes('/play/dates'));
console.log('PASS: ten verified future festivals, unique detail routes/photos/conditions, Korean date archive, reference-image schema exclusion, eight curated date places, routing and sitemap.');
