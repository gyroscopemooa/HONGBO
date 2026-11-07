import test from 'node:test';
import assert from 'node:assert/strict';
import { promoHashtags } from '../src/hashtags.mjs';
import { formatPromo, weightedLength } from '../src/copy.mjs';
import { formatSelfPromo } from '../src/self-promo.mjs';

test('five common tags rotate reproducibly; contextual tags need source evidence', () => {
  const plain = { post_id: 1, title: '소개합니다' };
  assert.equal(promoHashtags(plain).length, 5);
  assert.equal(promoHashtags(plain)[0], '#더홍보');
  assert.deepEqual(promoHashtags(plain), promoHashtags(plain));
  assert.notDeepEqual(promoHashtags(plain), promoHashtags({ ...plain, post_id: 2 }));
  const cafe = promoHashtags({ ...plain, title: '카페 소개' });
  assert.equal(cafe.length, 7);
  assert.ok(cafe.includes('#카페'));
  assert.ok(!cafe.includes('#1인개발'));
  assert.equal(new Set(cafe).size, cafe.length);
});

test('tagged long and emoji-heavy posts retain URL and fit the weighted limit', () => {
  for (let id = 1; id <= 100; id++) {
    const text = formatPromo({ post_id: id, title: '번역 앱 자막 스트리밍 '.repeat(30), short_description: '🔥긴 소개'.repeat(300) }, 'https://www.thehongbo.com');
    assert.ok(weightedLength(text) <= 500);
    assert.ok(text.includes(`https://www.thehongbo.com/post/${id}`));
    assert.ok(text.includes('#더홍보'));
    assert.ok(weightedLength(formatSelfPromo(id).text) <= 500);
  }
});
