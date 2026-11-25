import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_MAP, SPECIALTY_CATEGORIES, isCategorySlug } from "./constants";
import { parsePostInput } from "./validation";

const base = { title: "전문 서비스 소개", shortDescription: "서비스 이용 방법 안내", description: "서비스의 종류와 이용 방법을 안내합니다. 자세한 내용은 문의해주세요.", externalUrl: "https://example.com/reserve" };
for (const category of Object.keys(SPECIALTY_CATEGORIES)) {
  test(category + " supports listing, price, contact and specialist information", () => {
    assert.ok(isCategorySlug(category));
    assert.ok(CATEGORY_MAP[category].cta);
    const r = parsePostInput({ ...base, category, price: "1회 80,000원", region: "울산", extra: { usageType: "offline", specialtyType: "  개인   서비스 ", specialtyDuration: "50분", specialtyProvider: "서비스 제공자" } });
    assert.ok(r.ok);
    assert.equal(r.data.category, category);
    assert.equal(r.data.price, "1회 80,000원");
    assert.equal(r.data.extra.specialtyType, "개인 서비스");
    assert.equal(r.data.extra.specialtyDuration, "50분");
    assert.equal(r.data.extra.specialtyProvider, "서비스 제공자");
    assert.equal(r.data.extra.usageType, "offline");
    assert.ok(parsePostInput({ ...base, category, externalUrl: "", contact: "문의@example.com" }).ok);
    assert.equal(parsePostInput({ ...base, category, externalUrl: "" }).ok, false);
    assert.equal(parsePostInput({ ...base, category, extra: { specialtyType: "가".repeat(101) } }).ok, false);
  });
}
test("other categories do not retain hidden specialty fields", () => {
  const r = parsePostInput({ ...base, category: "websites", price: "10000원", extra: { specialtyType: "촬영", specialtyProvider: "작가" } });
  assert.ok(r.ok);
  assert.equal(r.data.price, null);
  assert.equal(r.data.extra.specialtyType, undefined);
  assert.equal(r.data.extra.specialtyProvider, undefined);
});
