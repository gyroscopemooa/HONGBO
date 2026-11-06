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
  assert.match(copy, /^📢 울산 신규 카페 오픈/);
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
