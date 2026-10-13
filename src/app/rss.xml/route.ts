import { CATEGORY_MAP, SITE } from "@/lib/constants";
import { store } from "@/lib/store";
import { siteUrl } from "@/lib/utils";

// 네이버 서치어드바이저·구글에 RSS 로 제출하면 새 홍보글이 더 빨리 수집됩니다.
export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

export async function GET() {
  const base = siteUrl();
  const { items } = await store.listPosts({ publicOnly: true, sort: "latest", page: 1, pageSize: 50 });

  const entries = items
    .map((p) => {
      const url = `${base}/post/${p.id}`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(p.shortDescription)}</description>
      <category>${esc(CATEGORY_MAP[p.category]?.name ?? p.category)}</category>
      <pubDate>${new Date(p.bumpedAt || p.publishedAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(`${SITE.name} - 무료 홍보 사이트 최신 홍보글`)}</title>
    <link>${base}</link>
    <description>${esc(SITE.description)}</description>
    <language>ko</language>
${entries}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
}
