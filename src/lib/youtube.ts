const ID = /^[\w-]{11}$/;

/** 유튜브 주소(watch, youtu.be, shorts, embed, live)에서 영상 ID 를 꺼냅니다. 유튜브 주소가 아니면 null. */
export function parseYoutubeId(input: string | null | undefined): string | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, kind, second] = url.pathname.split("/");
    if (kind === "watch") id = url.searchParams.get("v");
    else if (kind === "shorts" || kind === "embed" || kind === "live") id = second ?? null;
  }
  return id && ID.test(id) ? id : null;
}

export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
