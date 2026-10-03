/**
 * 외부 링크/이미지 URL 검증.
 * - http/https 만 허용 (javascript:, data:, file: 등 차단)
 * - 계정정보(user:pass@) 포함 URL 차단
 * - localhost / 사설 IP / 내부망 호스트 차단 (문자열 수준 1차 방어; 서버 fetch 시에는 safe-fetch 가 DNS 단계에서 한 번 더 차단)
 */

const MAX_URL_LENGTH = 2000;

function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

export function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".lan") || h.endsWith(".home")) return true;
  if (h.includes(":")) return true; // IPv6 리터럴은 허용하지 않음
  if (isPrivateIPv4(h)) return true;
  // 점이 없는 호스트(내부망 이름)는 외부 링크로 부적합
  if (!h.includes(".")) return true;
  return false;
}

export interface UrlResult {
  ok: boolean;
  url: string;
  error?: string;
}

/** 사용자가 입력한 링크를 정리하고 검증합니다. scheme 이 없으면 https:// 를 붙입니다. */
export function normalizeExternalUrl(input: string | null | undefined): UrlResult {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: false, url: "", error: "링크를 입력해주세요." };
  if (raw.length > MAX_URL_LENGTH) return { ok: false, url: "", error: "링크가 너무 깁니다." };
  if (/\s/.test(raw)) return { ok: false, url: "", error: "링크에 공백이 있습니다." };

  let candidate = raw;
  if (/^[a-z][a-z0-9+.-]*:/i.test(candidate) && !/^https?:\/\//i.test(candidate)) {
    // javascript:, data:, file:, ftp: 등 — host:port 형태(example.com:8080)는 아래에서 걸러짐
    if (!/^[a-z0-9.-]+:\d+(\/|$)/i.test(candidate)) {
      return { ok: false, url: "", error: "http 또는 https 링크만 사용할 수 있어요." };
    }
  }
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;

  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    return { ok: false, url: "", error: "올바른 링크 형식이 아니에요." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, url: "", error: "http 또는 https 링크만 사용할 수 있어요." };
  }
  if (u.username || u.password) {
    return { ok: false, url: "", error: "계정 정보가 포함된 링크는 사용할 수 없어요." };
  }
  if (isBlockedHostname(u.hostname)) {
    return { ok: false, url: "", error: "외부에서 접속할 수 있는 공개 링크만 사용할 수 있어요." };
  }
  u.hash = u.hash === "#" ? "" : u.hash;
  return { ok: true, url: u.toString() };
}

const MAP_HOST_SUFFIXES = [
  "naver.com",
  "naver.me",
  "kakao.com",
  "kko.to",
  "kko.kakao.com",
  "goo.gl",
  "google.com",
  "google.co.kr",
];

/** 네이버지도 / 카카오맵 / Google Maps 링크인지 확인 */
export function isMapUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const ok = MAP_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
    if (!ok) return false;
    if (host.endsWith("google.com") || host.endsWith("google.co.kr")) {
      return u.pathname.startsWith("/maps");
    }
    return true;
  } catch {
    return false;
  }
}

/** 저장된 이미지 URL 로 허용하는 출처 — 우리 서버/스토리지로 업로드된 파일만 허용 */
export function isAllowedImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.length > 1000) return false;
  if (url.startsWith("/uploads/") || url.startsWith("/seed/") || url.startsWith("/defaults/")) {
    return !url.includes("..") && !url.includes("//");
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (base) {
    const prefix = `${base.replace(/\/+$/, "")}/storage/v1/object/public/post-images/`;
    if (url.startsWith(prefix) && !url.includes("..")) return true;
  }
  return false;
}
