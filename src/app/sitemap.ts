import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/constants";
import { store } from "@/lib/store";
import { siteUrl } from "@/lib/utils";

// 새 홍보글이 등록되면 바로 반영되도록 요청 시점에 생성합니다.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/posts`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/posts?sort=popular`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/region`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    ...CATEGORIES.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...["notices", "policy", "terms", "privacy", "contact"].map((p) => ({
      url: `${base}/${p}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];

  // 공개 중인 홍보글 (최대 5,000개)
  for (let page = 1; page <= 5; page++) {
    const { items } = await store.listPosts({ publicOnly: true, sort: "latest", page, pageSize: 1000 });
    for (const p of items) {
      entries.push({
        url: `${base}/post/${p.id}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    if (items.length < 1000) break;
  }
  return entries;
}
