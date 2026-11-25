import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, SERVICE_FIELDS, LEGACY_SERVICE_FIELDS } from "./constants";
import { parsePostInput } from "./validation";
const base = { title: "전문 서비스 소개", shortDescription: "서비스 이용 방법 안내", description: "서비스의 종류와 이용 방법을 안내합니다. 자세한 내용은 문의해주세요.", externalUrl: "https://example.com/reserve" };
for (const serviceField of Object.keys(SERVICE_FIELDS)) {
  test(serviceField + " writes under services and supports contact, fields and price", () => {
    const r = parsePostInput({ ...base, category: "services", extra: { serviceField, servicePrice: 80000, usageType: "offline", specialtyType: " 개인   서비스 ", specialtyDuration: "50분", specialtyProvider: "서비스 제공자" } });
    assert.ok(r.ok);
    assert.equal(r.data.category, "services");
    assert.equal(r.data.extra.serviceField, serviceField);
    assert.equal(r.data.price, "80,000원");
    assert.equal(r.data.extra.servicePriceBand, "under100");
    assert.equal(r.data.extra.specialtyType, "개인 서비스");
    assert.equal(r.data.extra.specialtyDuration, "50분");
    assert.equal(r.data.extra.specialtyProvider, "서비스 제공자");
    assert.ok(parsePostInput({ ...base, category: "services", externalUrl: "", contact: "help@example.com", extra: { serviceField } }).ok);
    assert.equal(parsePostInput({ ...base, category: "services", externalUrl: "", extra: { serviceField } }).ok, false);
  });
}
test("legacy categories are hidden and old drafts map to services", () => {
  for (const [category, field] of Object.entries(LEGACY_SERVICE_FIELDS)) {
    assert.ok(!CATEGORIES.some(c => c.slug === category));
    const r = parsePostInput({ ...base, category });
    assert.ok(r.ok);
    assert.equal(r.data.category, "services");
    assert.equal(r.data.extra.serviceField, field);
  }
});
test("invalid fields and prices are rejected; other categories discard service data", () => {
  assert.equal(parsePostInput({ ...base, category: "services", extra: { serviceField: "invalid" } }).ok, false);
  assert.equal(parsePostInput({ ...base, category: "services", extra: { servicePrice: -1 } }).ok, false);
  const r = parsePostInput({ ...base, category: "websites", price: "10000원", extra: { serviceField: "photography", servicePrice: 10000, specialtyType: "촬영" } });
  assert.ok(r.ok);
  assert.equal(r.data.price, null);
  assert.equal(r.data.extra.serviceField, undefined);
  assert.equal(r.data.extra.specialtyType, undefined);
});
