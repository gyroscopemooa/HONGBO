import { normalizeExternalUrl } from "./url";

export interface OgData {
  title: string | null;
  description: string | null;
  image: string | null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function metaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]*?content=["']([^"']*)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*?(?:property|name)=["']${esc}["']`, "i");
    const m = html.match(re1) ?? html.match(re2);
    if (m?.[1]) return decodeEntities(m[1]).trim();
  }
  return null;
}

/** HTML 의 <head> 일부에서 Open Graph / 기본 메타 정보를 뽑아냅니다. */
export function parseOg(html: string, baseUrl: string): OgData {
  const head = html.slice(0, 200_000);
  let title = metaContent(head, ["og:title", "twitter:title"]);
  if (!title) {
    const t = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (t) title = decodeEntities(t[1].replace(/\s+/g, " ")).trim();
  }
  const description = metaContent(head, ["og:description", "twitter:description", "description"]);
  let image = metaContent(head, ["og:image", "og:image:url", "twitter:image"]);
  if (image) {
    try {
      const abs = normalizeExternalUrl(new URL(image, baseUrl).toString());
      image = abs.ok ? abs.url : null;
    } catch {
      image = null;
    }
  }
  return {
    title: title ? title.slice(0, 120) : null,
    description: description ? description.replace(/\s+/g, " ").slice(0, 200) : null,
    image,
  };
}

/** 이미지 바이트의 매직 넘버로 실제 이미지 형식을 판별 */
export function sniffImage(buf: Uint8Array): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return { mime: "image/gif", ext: "gif" };
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}
