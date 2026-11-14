import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdRequestForm } from '../src/components/AdRequestForm';
import { HeroAdRequestForm } from '../src/components/HeroAdRequestForm';
const action = async () => {};
for (const kind of ['premium', 'banner'] as const) {
  const html = renderToStaticMarkup(<AdRequestForm initialKind={kind} posts={[]} action={action} />);
  assert(html.includes(`name="kind" value="${kind}"`));
  assert(html.includes('무료 광고 신청하기'));
  assert(html.includes('무료 신청은 입금 없이'));
  assert(html.includes('name="plan" value="week"'));
  assert(!html.includes('1개월'));
  const paid = renderToStaticMarkup(<AdRequestForm freeTrial={false} initialKind={kind} posts={[]} action={action} />);
  assert(paid.includes('1개월'));
  assert(paid.includes(kind === 'premium' ? '50,000원' : '100,000원'));
  assert(!html.includes('30,000'));
  assert(html.includes('<span class="min-w-0">무료 노출'));
}
const hero = renderToStaticMarkup(<HeroAdRequestForm posts={[{id:1,title:"test"}]} action={action} />);
assert(hero.includes('무료 슬라이드 광고 신청하기'));
assert(hero.includes('무료 신청은 입금 없이'));
assert(hero.includes('name="postId"'));
assert(hero.includes('name="plan" value="week"'));
const paidHero = renderToStaticMarkup(<HeroAdRequestForm freeTrial={false} posts={[]} action={action} />);
assert(paidHero.includes('90,000원'));
assert(!paidHero.includes('name="postId"'));
assert(!hero.includes('40,000'));
console.log('PASS ad type hidden inputs, free application notices, single wrapping text container for policy links');
