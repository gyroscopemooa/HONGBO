import { YoutubeEmbed } from "./YoutubeEmbed";
import { LinkedText } from "./LinkedText";
import { isAllowedImageUrl } from "@/lib/url";
import { parseYoutubeId } from "@/lib/youtube";
import type { BodyBlock } from "@/lib/types";

export function BodyBlocks({ blocks }: { blocks?: BodyBlock[] }) {
  if (!blocks?.length) return null;
  return <div className="mt-6 space-y-6">
    {blocks.map((block, index) => {
      if (block.type === "text") return <div key={index} className="prose-body"><LinkedText text={block.value} /></div>;
      const videoId = block.type === "youtube" ? parseYoutubeId(block.value) : null;
      if (block.type === "image" && !isAllowedImageUrl(block.value)) return null;
      if (block.type === "youtube" && !videoId) return null;
      return <figure key={index} className="min-w-0">
        {block.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.value} alt={block.caption || "본문 사진"} loading="lazy" decoding="async" className="mx-auto h-auto max-h-[1000px] max-w-full rounded-xl object-contain" />
        ) : videoId ? <YoutubeEmbed id={videoId} title={block.caption || "본문"} /> : null}
        {block.caption && <figcaption className="mt-2 break-words text-center text-[13px] text-muted">{block.caption}</figcaption>}
      </figure>;
    })}
  </div>;
}
