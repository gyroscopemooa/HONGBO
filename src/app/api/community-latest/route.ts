import { listMemberPosts } from "@/lib/member-community-store";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { items } = await listMemberPosts();
    return Response.json({ items: items.slice(0, 5).map(({ id, title, category, createdAt }) => ({ id, title, category, createdAt })), failed: false }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ items: [], failed: true }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
