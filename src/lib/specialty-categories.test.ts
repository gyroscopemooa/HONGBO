import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, INDEPENDENT_SERVICE_CATEGORIES, GENERAL_SERVICE_FIELDS, resolveServiceCategory, resolveServiceField, serviceFieldHref } from "./constants";
import { parsePostInput } from "./validation";
const base = { title: "전문 서비스 소개", shortDescription: "서비스 이용 방법 안내", description: "서비스의 종류와 이용 방법을 안내합니다. 자세한 내용은 문의해주세요.", externalUrl: "https://example.com/reserve" };
for (const serviceField of [...INDEPENDENT_SERVICE_CATEGORIES, ...GENERAL_SERVICE_FIELDS, "psychology" as const]) {
  test(serviceField + " supports contact, fields and price", () => {
    const category = resolveServiceCategory("services", serviceField);
    const r = parsePostInput({ ...base, category, extra: { serviceField, servicePrice: 80000, usageType: "offline", specialtyType: " 개인   서비스 ", specialtyDuration: "50분", specialtyProvider: "서비스 제공자" } });
    assert.ok(r.ok);
    assert.equal(r.data.category, category);
    assert.equal(r.data.extra.serviceField, serviceField);
    assert.equal(r.data.price, "80,000원");
    assert.equal(r.data.extra.servicePriceBand, "under100");
    assert.equal(r.data.extra.specialtyType, "개인 서비스");
    assert.equal(r.data.extra.specialtyDuration, "50분");
    assert.equal(r.data.extra.specialtyProvider, "서비스 제공자");
    assert.ok(parsePostInput({ ...base, category, externalUrl: "", contact: "help@example.com", extra: { serviceField } }).ok);
    assert.equal(parsePostInput({ ...base, category, externalUrl: "", extra: { serviceField } }).ok, false);
  });
}
test("independent categories have stable URLs and old service submissions move safely", () => {
  for (const category of INDEPENDENT_SERVICE_CATEGORIES) {
    assert.ok(CATEGORIES.some(c => c.slug === category));
    assert.equal(serviceFieldHref(category), "/category/" + category);
    const r = parsePostInput({ ...base, category: "services", extra: { serviceField: category } });
    assert.ok(r.ok);
    assert.equal(r.data.category, category);
    assert.equal(r.data.extra.serviceField, category);
  }
  assert.equal(resolveServiceCategory("services", "psychology"), "services");
  assert.equal(resolveServiceField("services", "psychology"), "psychology");
  assert.ok(!CATEGORIES.some(c => c.slug === "occupational-therapy"));
  assert.equal(resolveServiceCategory("occupational-therapy", undefined), "services");
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
