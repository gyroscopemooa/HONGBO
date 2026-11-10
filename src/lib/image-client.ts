"use client";

/** 브라우저에서 이미지를 WebP로 변환합니다. 게시글은 전체 해상도를 보존하고 광고는 지정 비율로 자릅니다. EXIF 위치정보는 제거됩니다. */
import { LIMITS } from "./constants";

const DEFAULT_MAX_W = 960;
const DEFAULT_RATIO = 16 / 9;

export interface ProcessOptions {
  /** 가로/세로 비율 (기본 16/9). 배너는 4/1 */
  ratio?: number;
  /** 결과 이미지 최대 가로 px (기본 960) */
  maxWidth?: number;
  /** true 면 자르지 않고 원본 비율 그대로 (긴 변 기준 maxWidth 이하로만 축소) */
  keepOriginal?: boolean;
  /** 자르지 않는 이미지의 원본 픽셀 크기를 보존합니다. */
  preserveResolution?: boolean;
}

export async function processImage(file: Blob, opts: ProcessOptions = {}): Promise<Blob> {
  const RATIO = opts.ratio ?? DEFAULT_RATIO;
  const MAX_W = opts.maxWidth ?? DEFAULT_MAX_W;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("이미지를 읽을 수 없어요. 다른 파일을 선택해주세요.");
  }

  const a = bitmap.width / bitmap.height;
  let sw = bitmap.width;
  let sh = bitmap.height;
  let tw: number;
  let th: number;
  let sx = 0;
  let sy = 0;
  if (opts.keepOriginal) {
    const scale = opts.preserveResolution ? 1 : Math.min(1, MAX_W / Math.max(sw, sh));
    tw = Math.max(1, Math.round(sw * scale));
    th = Math.max(1, Math.round(sh * scale));
  } else {
    if (a > RATIO) sw = Math.round(bitmap.height * RATIO);
    else sh = Math.round(bitmap.width / RATIO);
    sx = Math.round((bitmap.width - sw) / 2);
    sy = Math.round((bitmap.height - sh) / 2);
    tw = Math.min(MAX_W, sw);
    th = Math.round(tw / RATIO);
  }

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이 브라우저에서는 이미지를 처리할 수 없어요.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, tw, th);
  bitmap.close?.();

  const toBlob = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  if (opts.keepOriginal && opts.preserveResolution) {
    // Prefer a small download without cropping or reducing the image dimensions.
    const targetBytes = 1024 * 1024;
    let smallest: Blob | null = null;
    for (const quality of [0.86, 0.78, 0.7, 0.6]) {
      const blob = await toBlob("image/webp", quality);
      if (!blob || blob.type !== "image/webp") continue;
      if (!smallest || blob.size < smallest.size) smallest = blob;
      if (blob.size <= targetBytes) return blob;
    }
    if (smallest && smallest.size <= LIMITS.uploadMaxBytes) return smallest;
    // JPEG cannot preserve transparency, so only use it if WebP is unsupported.
    if (!smallest) {
      for (const quality of [0.86, 0.78, 0.7, 0.6]) {
        const jpg = await toBlob("image/jpeg", quality);
        if (!jpg) continue;
        if (!smallest || jpg.size < smallest.size) smallest = jpg;
        if (jpg.size <= targetBytes) return jpg;
      }
      if (smallest && smallest.size <= LIMITS.uploadMaxBytes) return smallest;
    }
    throw new Error("원본 해상도를 유지한 파일이 4MB를 초과해요. 파일 용량을 줄여 다시 올려주세요. 이미지를 자동으로 자르거나 축소하지 않습니다.");
  }
  const webp = await toBlob("image/webp", 0.86);
  if (webp && webp.type === "image/webp") return webp;
  const jpg = await toBlob("image/jpeg", 0.88);
  if (!jpg) throw new Error("이미지를 변환하지 못했어요.");
  return jpg;
}

export async function uploadImage(blob: Blob): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, blob.type === "image/webp" ? "image.webp" : "image.jpg");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "이미지 업로드에 실패했어요.");
  return data.url;
}

/** 파일 선택 → 비율 보존 또는 지정 비율 크롭 → 압축 → 업로드 → URL */
export async function processAndUpload(file: Blob, opts: ProcessOptions = {}): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 올릴 수 있어요.");
  if (file.size > 25 * 1024 * 1024) throw new Error("원본 이미지가 너무 커요. 25MB 이하로 올려주세요.");
  return uploadImage(await processImage(file, opts));
}
