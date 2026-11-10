import type { PostInput } from "./types";

type Content = Pick<PostInput, "externalUrl" | "title" | "shortDescription" | "description">;

/** Compare destinations, preserving product IDs and meaningful query parameters. */
export function destinationKey(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (!["https:", "http:"].includes(u.protocol)) return null;
    const host = u.hostname.toLowerCase();
    if (host === "play.google.com" && u.pathname === "/store/apps/details" && u.searchParams.get("id")) {
      return `android:${u.searchParams.get("id")}`;
    }
    if (host === "apps.apple.com") {
      const id = u.pathname.match(/\/id(\d+)(?:\/|$)/)?.[1];
      if (id) return `ios:${id}`;
    }
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_.+|gclid|dclid|fbclid|msclkid)$/i.test(key)) u.searchParams.delete(key);
    }
    u.searchParams.sort();
    // Keep fragments: some sites use them to identify separate products/routes.
    return `${u.host.toLowerCase()}${u.pathname}${u.search}${u.hash}`;
  } catch { return null; }
}

function appKeys(p: Content): Set<string> {
  const urls = [p.externalUrl ?? "", ...(p.description.match(/https?:\/\/[^\s<>"']+/g) ?? [])];
  return new Set(urls.map(destinationKey).filter((k): k is string => !!k && /^(android|ios):/.test(k)));
}

function textKey(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[\p{P}\p{Z}\p{C}\s]/gu, "");
}

/** Conservative blocking: shared destination/app identity or substantial copied content. */
export function isDuplicatePost(a: Content, b: Content): boolean {
  const destination = a.externalUrl && destinationKey(a.externalUrl);
  if (destination && b.externalUrl && destination === destinationKey(b.externalUrl)) return true;
  const apps = appKeys(a);
  if ([...appKeys(b)].some((key) => apps.has(key))) return true;
  const body = textKey(a.description);
  if (body.length >= 80 && body === textKey(b.description)) return true;
  const title = textKey(a.title);
  const short = textKey(a.shortDescription);
  return title.length >= 10 && short.length >= 30 && title === textKey(b.title) && short === textKey(b.shortDescription);
}
