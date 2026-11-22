import assert from "node:assert/strict";
import { parsePostInput } from "../src/lib/validation";
import { processImage } from "../src/lib/image-client";
import { LIMITS } from "../src/lib/constants";
import type { BodyBlock } from "../src/lib/types";

const base = { category: "websites", title: "사용 방법 안내", shortDescription: "사진과 영상으로 사용법을 안내합니다", description: "먼저 아래 순서에 따라 사용해주세요.", externalUrl: "https://example.com" };
const parse = (blocks: BodyBlock[]) => parsePostInput({ ...base, extra: { bodyBlocks: blocks } });
const blocks: BodyBlock[] = [
  { id: "1", type: "text", value: "  첫 번째 안내  " },
  { id: "2", type: "image", value: "/uploads/example.webp", caption: "사용 화면" },
  { id: "3", type: "youtube", value: "https://youtu.be/dQw4w9WgXcQ" },
];
const result = parse(blocks);
assert.ok(result.ok, JSON.stringify(result));
if (result.ok) {
  assert.equal(result.data.extra.bodyBlocks?.[0].value, "첫 번째 안내");
  assert.equal(result.data.extra.bodyBlocks?.[2].value, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.deepEqual(result.data.extra.bodyBlocks?.map(b => b.type), ["text", "image", "youtube"]);
}
assert.equal(parsePostInput(base).ok, true, "기존 텍스트 글 호환");
for (const value of ["javascript:alert(1)", "data:image/png;base64,abc", "https://evil.test/a.png", "/uploads/../secret"]) {
  assert.equal(parse([{ id: "x", type: "image", value }]).ok, false, value);
}
assert.equal(parse([{ id: "x", type: "youtube", value: "https://evil.test/watch?v=dQw4w9WgXcQ" }]).ok, false);
assert.equal(parse([{ id: "x", type: "text", value: "가".repeat(LIMITS.descMax) }]).ok, false);
assert.equal(parse(Array.from({ length: 7 }, (_, i) => ({ id: String(i), type: "image", value: "/uploads/a.webp" }))).ok, false);
assert.equal(parse(Array.from({ length: 4 }, (_, i) => ({ id: String(i), type: "youtube", value: "https://youtu.be/dQw4w9WgXcQ" }))).ok, false);
assert.equal(parse([blocks[0], blocks[0]]).ok, false);

let sizes: number[] = [];
const canvas = { width: 0, height: 0, getContext: () => ({ drawImage() {}, imageSmoothingQuality: "high" }), toBlob(callback: (blob: Blob) => void, type: string) { callback(new Blob([new Uint8Array(sizes.shift() ?? 500_000)], { type })); } };
Object.defineProperty(globalThis, "document", { value: { createElement: () => canvas } });
Object.defineProperty(globalThis, "createImageBitmap", { value: async () => ({ width: 2400, height: 3600, close() {} }) });
async function main() {
  const options = { keepOriginal: true, maxWidth: 1600, maxBytes: LIMITS.bodyImageMaxBytes };
  sizes = [500_000, 300_000];
  const compressed = await processImage(new Blob(), options);
  assert.equal(compressed.size, 300_000);
  assert.equal(compressed.type, "image/webp");
  assert.deepEqual([canvas.width, canvas.height], [1067, 1600]);
  sizes = [500_000, 500_000, 500_000, 500_000, 300_000];
  assert.equal((await processImage(new Blob(), options)).type, "image/jpeg");
  sizes = [];
  await assert.rejects(processImage(new Blob(), options), /350KB/);
  console.log("Body blocks: validation, legacy compatibility, URL restrictions, limits and compression passed.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
