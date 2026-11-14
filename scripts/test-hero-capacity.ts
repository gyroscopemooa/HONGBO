import assert from 'node:assert/strict';
import { HERO_TOTAL_SLOTS, heroCustomerCapacity, selectHeroSlides } from '../src/lib/hero-capacity';
import { isHeroLive, type HeroAd } from '../src/lib/hero-ads';
const defaults = Array.from({length:8}, (_, i) => `default-${i}`);
for (const infl of [false, true]) {
  assert.equal(heroCustomerCapacity(infl), infl ? 9 : 10);
  for (let count=0; count<=15; count++) {
    const result = selectHeroSlides(Array.from({length:count},(_,i)=>i), defaults, infl);
    assert(result.total <= HERO_TOTAL_SLOTS);
    assert.equal(result.defaults.length, Math.min(8,10-result.ads.length-Number(infl)));
  }
}
assert.equal(selectHeroSlides([],defaults,true).total,9);
assert.equal(selectHeroSlides([1,2],defaults,true).defaults.length,7);
assert.equal(selectHeroSlides([1,2,3],defaults,true).defaults.length,6);
assert.equal(selectHeroSlides(Array.from({length:9}),defaults,true).defaults.length,0);
const now=Date.parse('2026-11-14T12:00:00Z');
const live = {status:'active',startsAt:'2026-11-13T12:00:00Z',endsAt:'2026-11-14T12:00:00Z'} as HeroAd;
assert(isHeroLive(live,now-1));
assert(!isHeroLive(live,now));
assert(!isHeroLive({...live,status:'requested'},now-1));
const restored = selectHeroSlides([live].filter(a=>isHeroLive(a,now)),defaults,true);
assert.equal(restored.defaults.length,8);
assert.equal(restored.total,9);
console.log('PASS total cap 10, infl09 reservation, 8 defaults, replacement, overflow clamp and expiration restoration');
