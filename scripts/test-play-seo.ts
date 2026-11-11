import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { PLAY_PLACES } from "../src/data/play";
import { PLAY_TOURISM } from "../src/data/play-tourism";
import { PLAY_REGIONS } from "../src/data/play-regions";
import { playPhoto } from "../src/data/play-photos";
import { playDetailSchema,playMetadata,safeJsonLd } from "../src/lib/play-seo";
for(const p of PLAY_PLACES){
 const json=JSON.stringify(playDetailSchema(p));const data=JSON.parse(json);const page=data['@graph'][0];
 assert.equal(page.url.endsWith('/play/'+p.slug),true);
 const meta=playMetadata(p);assert.equal(meta.alternates?.canonical,'/play/'+p.slug);
 if(p.schedulePending){assert(!page.mainEntity,'Pending event must not publish Event markup');assert(String(meta.description).includes('미확인'));}
 else if(p.kind==='축제·행사'){assert.equal(page.mainEntity['@type'],'Event');assert.equal(page.mainEntity.startDate,p.startDate);}
 if(playPhoto(p.slug)?.label?.includes('참고'))assert(!page.mainEntity?.image,'Reference photo is not an event image');
 assert(!json.includes('aggregateRating'));
}
for(const p of PLAY_TOURISM){assert(existsSync('public'+playPhoto(p.slug)!.src));assert(new URL(p.source).hostname==='korean.visitkorea.or.kr');assert(p.guide);}
for(const r of PLAY_REGIONS)assert(PLAY_PLACES.some(p=>p.region===r.region&&p.slug===r.hero));
const payload={title:'</script><script>alert(1)</script>'};const safe=safeJsonLd(payload);assert(!safe.includes('<'));assert.deepEqual(JSON.parse(safe),payload);
console.log('SEO passed: all details, canonical, verified Event only, reference images excluded, safe JSON-LD, regional content and photo integrity.');
import { unknownPlayEditorialPath } from "../src/lib/play-routing";
assert(unknownPlayEditorialPath('/play/region/not-a-region'));
assert(unknownPlayEditorialPath('/play/not-a-place'));
for(const path of ['/play','/play/share','/play/shared/example','/play/archive','/play/design','/community','/play/region/ulsan/'])assert(!unknownPlayEditorialPath(path),path);
for(const p of PLAY_PLACES)assert(!unknownPlayEditorialPath('/play/'+p.slug));
console.log('Editorial route validation passed.');
