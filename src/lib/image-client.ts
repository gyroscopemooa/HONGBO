"use client";

/** 브라우저에서 이미지를 16:9 로 자동 크롭하고 webp 로 줄입니다. (EXIF 위치정보도 함께 제거됩니다.) */

const MAX_W = 960;
const RATIO = 16 / 9;

export async function processImage(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("이미지를 읽을 수 없어요. 다른 파일을 선택해주세요.");
  }

  const a = bitmap.width / bitmap.height;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (a > RATIO) sw = Math.round(bitmap.height * RATIO);
  else sh = Math.round(bitmap.width / RATIO);
  const sx = Math.round((bitmap.width - sw) / 2);
  const sy = Math.round((bitmap.height - sh) / 2);

  const tw = Math.min(MAX_W, sw);
  const th = Math.round(tw / RATIO);

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이 브라우저에서는 이미지를 처리할 수 없어요.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, tw, th);
  bitmap.close?.();

  const toBlob = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
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

/** 파일 선택 → 자동 크롭 → 업로드 → URL */
export async function processAndUpload(file: Blob): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 올릴 수 있어요.");
  if (file.size > 25 * 1024 * 1024) throw new Error("원본 이미지가 너무 커요. 25MB 이하로 올려주세요.");
  return uploadImage(await processImage(file));
}
