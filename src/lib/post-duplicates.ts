import type { PostInput } from "./types";

type Content = Pick<PostInput, "externalUrl" | "title" | "shortDescription" | "description" | "extra">;

const DISCORD_HOSTS = new Set(["discord.gg", "discord.com", "www.discord.com", "discordapp.com", "www.discordapp.com"]);
const discordInviteGuildCache = new Map<string, Promise<string | null>>();

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

function allUrls(p: Content): string[] {
  return [
    p.externalUrl ?? "",
    ...(p.description.match(/https?:\/\/[^\s<>"']+/g) ?? []),
    ...(p.extra.links?.map((link) => link.url) ?? []),
    p.extra.exclusive?.url ?? "",
  ];
}

function appKeys(p: Content): Set<string> {
  const urls = allUrls(p);
  return new Set(urls.map(destinationKey).filter((k): k is string => !!k && /^(android|ios):/.test(k)));
}

function textKey(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[\p{P}\p{Z}\p{C}\s]/gu, "");
}

function discordInviteCode(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!DISCORD_HOSTS.has(url.hostname.toLowerCase())) return null;
    const part = url.hostname.toLowerCase() === "discord.gg"
      ? url.pathname.split("/").filter(Boolean)[0]
      : url.pathname.match(/^\/invite\/([^/]+)/i)?.[1];
    return part && /^[a-z0-9_-]{2,128}$/i.test(part) ? part : null;
  } catch { return null; }
}

function discordChannelServerId(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!DISCORD_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url.pathname.match(/^\/channels\/(\d{5,})\//i)?.[1] ?? null;
  } catch { return null; }
}

async function discordServerKey(raw: string): Promise<string | null> {
  const channelServer = discordChannelServerId(raw);
  if (channelServer) return `discord:${channelServer}`;
  const invite = discordInviteCode(raw);
  if (!invite) return null;
  let cached = discordInviteGuildCache.get(invite.toLowerCase());
  if (!cached) {
    cached = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3_000);
      try {
        const response = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(invite)}?with_counts=false&with_expiration=false`, { signal: controller.signal });
        if (!response.ok) return null;
        const data = await response.json() as { guild?: { id?: unknown } };
        return typeof data.guild?.id === "string" && /^\d{5,}$/.test(data.guild.id) ? `discord:${data.guild.id}` : null;
      } catch { return null; }
      finally { clearTimeout(timeout); }
    })();
    discordInviteGuildCache.set(invite.toLowerCase(), cached);
  }
  return cached;
}

/** Blocks the same account from re-posting one destination, Discord server, app, or copied listing. */
export async function isDuplicatePost(a: Content, b: Content): Promise<boolean> {
  const destination = a.externalUrl && destinationKey(a.externalUrl);
  if (destination && b.externalUrl && destination === destinationKey(b.externalUrl)) return true;
  const [aDiscord, bDiscord] = await Promise.all([
    Promise.all(allUrls(a).map(discordServerKey)),
    Promise.all(allUrls(b).map(discordServerKey)),
  ]);
  const aServers = new Set(aDiscord.filter((key): key is string => !!key));
  if (bDiscord.some((key) => !!key && aServers.has(key))) return true;
  const apps = appKeys(a);
  if ([...appKeys(b)].some((key) => apps.has(key))) return true;
  const body = textKey(a.description);
  if (body.length >= 80 && body === textKey(b.description)) return true;
  const title = textKey(a.title);
  const short = textKey(a.shortDescription);
  return !!title && !!short && title === textKey(b.title) && short === textKey(b.shortDescription);
}
