import type { JSONContent } from "@tiptap/react";
import type { BodyBlock } from "./types";
import { parseYoutubeId, youtubeWatchUrl } from "./youtube";

export function bodyDocument(description: string, blocks: BodyBlock[], rich: boolean): JSONContent {
  const source: BodyBlock[] = rich ? blocks : [{ id: "intro", type: "text", value: description }, ...blocks];
  const content: JSONContent[] = source.flatMap((block): JSONContent[] => {
    if (block.type === "text") return block.value.split("\n").map(line => ({ type: "paragraph", content: line ? [{ type: "text", text: line }] : [] }));
    if (block.type === "image") return [{ type: "image", attrs: { src: block.value, alt: block.caption || "본문 사진", title: block.caption || null } }];
    const id = parseYoutubeId(block.value);
    return id ? [{ type: "bodyYoutube", attrs: { videoId: id, caption: block.caption || "" } }] : [];
  });
  if (!content.length || content.at(-1)?.type !== "paragraph") content.push({ type: "paragraph" });
  return { type: "doc", content };
}

export function documentBody(document: JSONContent): { description: string; blocks: BodyBlock[] } {
  const blocks: BodyBlock[] = [];
  let lines: string[] = [];
  const flush = () => {
    const text = lines.join("\n").trim();
    if (text) blocks.push({ id: `body-${blocks.length}`, type: "text", value: text });
    lines = [];
  };
  for (const node of document.content ?? []) {
    if (node.type === "paragraph") {
      lines.push((node.content ?? []).map(part => part.type === "hardBreak" ? "\n" : part.text ?? "").join(""));
      continue;
    }
    flush();
    if (node.type === "image") blocks.push({ id: `body-${blocks.length}`, type: "image", value: String(node.attrs?.src ?? ""), caption: String(node.attrs?.title ?? "") });
    if (node.type === "bodyYoutube" && /^[\w-]{11}$/.test(node.attrs?.videoId ?? "")) blocks.push({ id: `body-${blocks.length}`, type: "youtube", value: youtubeWatchUrl(node.attrs!.videoId), caption: String(node.attrs?.caption ?? "") });
  }
  flush();
  return { description: blocks.filter(b => b.type === "text").map(b => b.value).join("\n\n"), blocks };
}
