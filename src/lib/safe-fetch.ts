import "server-only";
import { normalizeExternalUrl } from "./url";

/**
 * 사용자가 입력한 외부 URL 을 서버에서 가져올 때 쓰는 SSRF 방어 fetch.
 * Node.js 와 Cloudflare Workers 양쪽에서 동작하도록 표준 fetch 만 사용합니다.
 *
 * - http/https, 기본 포트(80/443)만 허용
 * - 요청 전에 DNS-over-HTTPS 로 호스트의 모든 A/AAAA 주소를 조회해서
 *   사설/루프백/링크로컬/메타데이터 대역이 하나라도 있으면 차단
 * - 리다이렉트는 최대 3번, 매번 같은 검증 수행
 * - 타임아웃 + 응답 크기 제한
 *
 * 참고: Cloudflare Workers 의 fetch 는 플랫폼 차원에서 사설망/루프백으로 나갈 수 없어 이중으로 방어됩니다.
 */

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((a, b) => (a << 8) + Number(b), 0) >>> 0;
}

function inCidr4(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

const BLOCKED_V4: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // 클라우드 메타데이터(169.254.169.254) 포함
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

const V4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isPrivateIp(ip: string): boolean {
  const v4 = ip.match(V4_RE);
  if (v4) {
    if (v4.slice(1).some((p) => Number(p) > 255)) return true;
    return BLOCKED_V4.some(([b, bits]) => inCidr4(ip, b, bits));
  }
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    if (/^f[cd]/.test(lower)) return true; // fc00::/7
    if (/^fe[89ab]/.test(lower)) return true; // fe80::/10
    if (lower.startsWith("ff")) return true; // multicast
    if (lower.startsWith("2001:db8")) return true;
    return false;
  }
  return true; // 알 수 없는 형식은 차단
}

interface DohAnswer {
  type: number;
  data: string;
}

async function resolveAll(hostname: string, signal: AbortSignal): Promise<string[]> {
  // IP 리터럴이면 조회 없이 그대로 검사
  if (V4_RE.test(hostname)) return [hostname];

  const out: string[] = [];
  for (const type of ["A", "AAAA"]) {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`, {
      headers: { accept: "application/dns-json" },
      signal,
    });
    if (!res.ok) throw new SafeFetchError("dns lookup failed");
    const json = (await res.json()) as { Answer?: DohAnswer[] };
    for (const a of json.Answer ?? []) {
      if (a.type === 1 || a.type === 28) out.push(a.data);
    }
  }
  if (out.length === 0) throw new SafeFetchError("host not found");
  return out;
}

export interface SafeFetchResult {
  status: number;
  contentType: string;
  finalUrl: string;
  body: Uint8Array;
  truncated: boolean;
}

export class SafeFetchError extends Error {}

export async function safeFetch(
  rawUrl: string,
  opts: { accept: string; maxBytes: number; timeoutMs?: number; allowTruncate?: boolean },
): Promise<SafeFetchResult> {
  const first = normalizeExternalUrl(rawUrl);
  if (!first.ok) throw new SafeFetchError(first.error ?? "invalid url");
  let url = first.url;
  const signal = AbortSignal.timeout(opts.timeoutMs ?? 8000);

  for (let hop = 0; hop <= 3; hop++) {
    const u = new URL(url);
    if (u.port && u.port !== "80" && u.port !== "443") throw new SafeFetchError("port not allowed");

    const addrs = await resolveAll(u.hostname, signal);
    if (addrs.some(isPrivateIp)) throw new SafeFetchError("blocked address");

    const res = await fetch(url, {
      redirect: "manual",
      signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; ThehongboLinkPreview/1.0; +https://www.thehongbo.com)",
        accept: opts.accept,
        "accept-language": "ko,en;q=0.8",
      },
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      await res.body?.cancel().catch(() => {});
      const next = normalizeExternalUrl(new URL(res.headers.get("location")!, url).toString());
      if (!next.ok) throw new SafeFetchError("redirect blocked");
      url = next.url;
      continue;
    }

    const chunks: Uint8Array[] = [];
    let size = 0;
    let truncated = false;
    if (res.body) {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > opts.maxBytes) {
          await reader.cancel().catch(() => {});
          if (!opts.allowTruncate) throw new SafeFetchError("response too large");
          truncated = true;
          const keep = value.byteLength - (size - opts.maxBytes);
          if (keep > 0) chunks.push(value.subarray(0, keep));
          break;
        }
        chunks.push(value);
      }
    }
    const body = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
    let off = 0;
    for (const c of chunks) {
      body.set(c, off);
      off += c.byteLength;
    }
    return { status: res.status, contentType: res.headers.get("content-type") ?? "", finalUrl: url, body, truncated };
  }
  throw new SafeFetchError("too many redirects");
}
