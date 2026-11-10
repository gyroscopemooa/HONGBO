"use server";

import { PostCard } from "@/components/PostCard";
import { store } from "@/lib/store";

/** 공개 전용 혜택만 10개씩 반환합니다. */
export async function loadExclusivePage(page: number) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) throw new Error("Invalid page");
  const { items, total } = await store.listPosts({ publicOnly: true, benefit: "exclusive", sort: "latest", page, pageSize: 10 });
  return { cards: items.map(post => ({ id: post.id, node: <PostCard post={post} /> })), total, hasMore: page * 10 < total && items.length > 0 };
}
