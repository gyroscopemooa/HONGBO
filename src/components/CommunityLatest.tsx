import { cache } from "react";
import { listMemberPosts } from "@/lib/member-community-store";
import { CommunityLatestView } from "./CommunityLatestView";
const latest = cache(async () => {
  try { return { items: (await listMemberPosts()).items.slice(0, 5).map(({id, title, category, createdAt}) => ({id, title, category, createdAt})), failed: false }; }
  catch { return { items: [], failed: true }; }
});
export async function CommunityLatest({ limit = 2, title = "커뮤니티 새 이야기" }: { limit?: 2 | 5; title?: string }) {
  return <CommunityLatestView limit={limit} title={title} initial={await latest()} />;
}
