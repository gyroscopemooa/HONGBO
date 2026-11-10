import { store } from "@/lib/store";
import type { Post } from "@/lib/types";
import { PostCard } from "./PostCard";
import { ExclusiveSlider } from "./ExclusiveSlider";

/** 공개 전용 이벤트를 최신순으로 탐색합니다. */
export async function ExclusiveStrip({ wrap = false, data }: { wrap?: boolean; data?: { items: Post[]; total: number } }) {
  const { items, total } = data ?? await store.listPosts({ publicOnly: true, benefit: "exclusive", sort: "latest", page: 1, pageSize: 10 });
  if (!items.length) return null;
  return <ExclusiveSlider key={items.map(p => `${p.id}:${p.updatedAt}`).join(",")} wrap={wrap} initialCards={items.map(post => ({ id: post.id, node: <PostCard post={post} /> }))} initialTotal={total} />;
}
