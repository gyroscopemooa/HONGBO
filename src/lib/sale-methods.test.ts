import test from "node:test";
import assert from "node:assert/strict";
import { parsePostInput } from "./validation";

const base = { category: "products", title: "직접 만든 스티커", shortDescription: "직접 그린 그림으로 만든 스티커입니다", description: "직접 그린 다양한 그림으로 만든 스티커를 소개합니다. 상품의 종류와 크기는 판매 페이지에서 확인해주세요.", externalUrl: "https://example.com/shop" };
test("existing sale posts do not require either method", () => {
  const r = parsePostInput(base);
  assert.ok(r.ok);
  assert.equal(r.data.extra.deliveryMethod, undefined);
  assert.equal(r.data.extra.saleMethod, undefined);
});
test("sale methods are normalized and persisted independently", () => {
  const r = parsePostInput({ ...base, extra: { deliveryMethod: "  택배   또는 방문 수령 ", saleMethod: "문의 후 주문" } });
  assert.ok(r.ok);
  assert.equal(r.data.extra.deliveryMethod, "택배 또는 방문 수령");
  assert.equal(r.data.extra.saleMethod, "문의 후 주문");
});
test("clearing methods removes previous optional values", () => {
  const r = parsePostInput({ ...base, extra: { deliveryMethod: "  ", saleMethod: "" } });
  assert.ok(r.ok);
  assert.equal(r.data.extra.deliveryMethod, undefined);
  assert.equal(r.data.extra.saleMethod, undefined);
});
test("switching away from sales drops hidden method values", () => {
  const r = parsePostInput({ ...base, category: "websites", extra: { deliveryMethod: "택배", saleMethod: "온라인 주문" } });
  assert.ok(r.ok);
  assert.equal(r.data.extra.deliveryMethod, undefined);
  assert.equal(r.data.extra.saleMethod, undefined);
});
test("oversized and malformed sale fields are rejected server-side", () => {
  for (const extra of [{ deliveryMethod: "가".repeat(81) }, { saleMethod: ["택배"] }]) {
    assert.equal(parsePostInput({ ...base, extra }).ok, false);
  }
});
test("delivery period is optional even with delivery selected", () => {
  const r = parsePostInput({ ...base, extra: { deliveryMethod: "택배" } });
  assert.ok(r.ok);
  assert.equal(r.data.extra.deliveryPeriod, undefined);
});
test("delivery period persists only with a delivery method", () => {
  for (const method of ["택배", "", "  "]) {
    const r = parsePostInput({ ...base, extra: { deliveryMethod: method, deliveryPeriod: "  영업일 기준  2~3일 " } });
    assert.ok(r.ok);
    assert.equal(r.data.extra.deliveryPeriod, method.trim() ? "영업일 기준 2~3일" : undefined);
  }
});
test("non-sale posts discard delivery period and too-long period is rejected", () => {
  const r = parsePostInput({ ...base, category: "websites", extra: { deliveryMethod: "택배", deliveryPeriod: "2일" } });
  assert.ok(r.ok);
  assert.equal(r.data.extra.deliveryPeriod, undefined);
  assert.equal(parsePostInput({ ...base, extra: { deliveryMethod: "택배", deliveryPeriod: "가".repeat(81) } }).ok, false);
});
