import test from "node:test";
import assert from "node:assert/strict";
import { formatPromo, runOnce } from "../src/index.mjs";

const site = "https://www.thehongbo.com";
const original = {
  post_id: 123,
  title: "울산 신규 카페 오픈",
  short_description: "오픈 기념 이벤트를 진행합니다. 삼산동에 위치해 있어요.",
  description: "본격적인 카페 홍보입니다."
};

test("source-first copy contains actual information, platform pitch and the original link", () => {
  const copy = formatPromo(original, site);
  assert.match(copy, /\n\n울산 신규 카페 오픈/);
  assert.ok(copy.endsWith('?'));
  assert.match(copy, /오픈 기념 이벤트를 진행합니다/);
  assert.match(copy, /https:\/\/www\.thehongbo\.com\/post\/123/);
  assert.match(copy, /무료 홍보는 더홍보에서!/);
  assert.match(copy, /더홍보/);
});

test("same post ID always yields the same closing joke", () => {
  assert.equal(formatPromo(original, site), formatPromo(original, site));
  assert.notEqual(
    formatPromo(original, site),
    formatPromo({ ...original, post_id: 124 }, site)
  );
});

test("AI supplement does not replace the original short description", () => {
  const copy = formatPromo(original, site, "새로 생긴 공간을 구경해 보세요.");
  assert.ok(copy.indexOf("오픈 기념 이벤트") < copy.indexOf("새로 생긴 공간"));
});

test("social copy does not reprint phone numbers, emails or unrelated external URLs", () => {
  const copy = formatPromo({
    ...original,
    short_description: "010-1234-5678 hello@example.com https://private.example/visit"
  }, site);
  assert.doesNotMatch(copy, /010-1234-5678|hello@example.com|private\.example/);
  assert.match(copy, /\[연락처는 원문 참고\]/);
});

test("emoji-heavy original text is truncated and never crowds out the official link", () => {
  const copy = formatPromo({
    ...original,
    short_description: "🔥".repeat(600)
  }, site);
  assert.ok([...copy].length < 500);
  assert.match(copy, /https:\/\/www\.thehongbo\.com\/post\/123/);
});

test("disabled automation cannot attempt any network request", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("should not fetch"); };
  try { assert.equal(await runOnce({ AUTOPOST_ENABLED: "false" }), "disabled"); }
  finally { globalThis.fetch = oldFetch; }
});

test("automatic posting requires an explicit activation date", async () => {
  await assert.rejects(() => runOnce({ AUTOPOST_ENABLED: "true" }), /THREADS_START_AT/);
});


test("fresh phrases require a recent original publish timestamp; templates contain no emoji", () => {
  const now = Date.parse('2026-11-07T00:00:00Z');
  const p = { ...original, post_id: 120 };
  const old = formatPromo({ ...p, published_at: '2026-10-03T00:00:00Z' }, site, '', { now });
  const fresh = formatPromo({ ...p, published_at: '2026-11-06T23:00:00Z' }, site, '', { now });
  assert.doesNotMatch(old, /새 홍보글|새로운 홍보글|방금|새 글 올라/);
  assert.match(fresh, /새 홍보글|새로운 홍보글|방금|새 글 올라|최신|새로|새 소식|새 이벤트|새 홍보|새 글이/);
  assert.doesNotMatch(fresh, /\p{Extended_Pictographic}/u);
  assert.doesNotMatch(formatPromo(p, site), /새 홍보글|방금/);
});

test("official variants preserve freshness, event relevance, source and character budget", async () => {
  const { weightedLength } = await import('../src/copy.mjs');
  const now = Date.parse('2026-11-08T00:00:00Z');
  const openings = new Set();
  const endings = new Set();
  for (let id = 0; id < 480; id++) {
    const post = { post_id: id, title: '서비스 소개', short_description: '설명'.repeat(400), published_at: '2026-11-07T23:00:00Z' };
    const text = formatPromo(post, site, '', { now });
    assert.ok(weightedLength(text) <= 500);
    assert.ok(text.includes(`${site}/post/${id}`));
    assert.doesNotMatch(text.split('\n\n')[0], /이벤트/);
    endings.add(text.split('\n무료 홍보')[0].split('\n\n').at(-1));
    if (id % 5 === 0) openings.add(text.split('\n\n')[0]);
    const old = formatPromo({ ...post, published_at: '2026-10-01' }, site, '', { now });
    assert.doesNotMatch(old.split('\n\n')[0], /최신|새로|새 글/);
  }
  assert.equal(openings.size, 12);
  assert.ok(endings.size >= 16);
  const eventOpenings = Array.from({ length: 18 }, (_, n) => formatPromo({
    ...original, post_id: n, published_at: '2026-11-07T23:00:00Z',
  }, site, '', { now }).split('\n\n')[0]);
  assert.equal(eventOpenings.filter(x => /이벤트/.test(x)).length, 6);
  for (const short_description of ['이벤트를 진행하지 않습니다.', '이벤트 종료 안내']) {
    for (let n = 0; n < 18; n++) {
      const text = formatPromo({ ...original, post_id: n * 5, short_description, published_at: '2026-11-07T23:00:00Z' }, site, '', { now });
      assert.doesNotMatch(text.split('\n\n')[0], /이벤트/);
    }
  }
});

test('every post has an opener and finishes with a relevant question, after hashtags', () => {
  for (let id = 1; id <= 48; id++) {
    const copy = formatPromo({ post_id: id, title: '헬띠루틴 운동앱', short_description: '운동일지와 루틴관리' }, site);
    assert.notEqual(copy.split('\n\n')[0], '헬띠루틴 운동앱');
    assert.match(copy.split('\n\n').at(-1), /운동.*\?$/u);
    assert.doesNotMatch(copy.split('\n\n').at(-1), /홍보/u);
  }
  const translation = formatPromo({ post_id: 1, title: '해외 방송 자막 번역 앱' }, site);
  assert.match(translation.split('\n\n').at(-1), /언어/);
  const unknown = formatPromo({ post_id: 1, title: '소식' }, site);
  assert.ok(unknown.endsWith('?'));
});

test('use the advertised HTTPS destination and safely fall back for invalid URLs', () => {
  const direct = 'https://play.google.com/store/apps/details?id=com.healthyroutine.app';
  assert.ok(formatPromo({ ...original, external_url: direct }, site).includes(direct));
  for (const external_url of ['javascript:alert(1)', 'https://user:password@example.com', 'invalid', 'https://example.com/' + 'x'.repeat(500)]) {
    const copy = formatPromo({ ...original, external_url }, site);
    assert.ok(copy.includes(`${site}/post/123`));
    assert.ok(copy.endsWith('?'));
  }
});
