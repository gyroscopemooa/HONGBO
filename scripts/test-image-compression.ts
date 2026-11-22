import assert from "node:assert/strict";
import { processImage } from "../src/lib/image-client";

// Exercise size selection with a controlled encoder; actual browser encoding varies.
const mb = 1024 * 1024;
let sizes: number[] = [];
let requestedTypes: string[] = [];
let drawn: number[] = [];
let webpSupported = true;
const canvas = {
  width: 0,
  height: 0,
  getContext: () => ({
    imageSmoothingQuality: "low",
    drawImage: (_bitmap: unknown, ...args: number[]) => { drawn = args; },
  }),
  toBlob: (callback: (blob: Blob) => void, type: string) => {
    requestedTypes.push(type);
    const actualType = type === "image/webp" && !webpSupported ? "image/png" : type;
    callback(new Blob([new Uint8Array(sizes.shift() ?? 5 * mb)], { type: actualType }));
  },
};
Object.defineProperty(globalThis, "document", { value: { createElement: () => canvas } });
Object.defineProperty(globalThis, "createImageBitmap", {
  value: async () => ({ width: 1600, height: 2400, close() {} }),
});
const original = { keepOriginal: true, preserveResolution: true };
const file = new Blob([], { type: "image/png" });

async function main() {
  sizes = [2 * mb, 900_000];
  assert.equal((await processImage(file, original)).size, 900_000);
  assert.deepEqual([canvas.width, canvas.height], [1600, 2400]);
  assert.deepEqual(drawn, [0, 0, 1600, 2400, 0, 0, 1600, 2400]);

  sizes = [3 * mb, 2 * mb, 2.5 * mb, 1.5 * mb];
  assert.equal((await processImage(file, original)).size, 1.5 * mb);

  requestedTypes = [];
  sizes = [5 * mb, 5 * mb, 5 * mb, 5 * mb];
  await assert.rejects(processImage(file, original), /4MB/);
  assert.ok(requestedTypes.every(type => type === "image/webp"));

  webpSupported = false;
  sizes = [0, 0, 0, 0, 2 * mb, 800_000];
  const fallback = await processImage(file, original);
  assert.equal(fallback.type, "image/jpeg");
  assert.equal(fallback.size, 800_000);

  webpSupported = true;
  sizes = [100_000];
  await processImage(file);
  assert.deepEqual([canvas.width, canvas.height], [960, 540]);
  console.log("Image compression checks passed: full dimensions, target size, cap, fallback, and 16:9 crop.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
