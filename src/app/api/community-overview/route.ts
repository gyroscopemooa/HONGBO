import { getCommunityOverview } from "@/lib/community-overview";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await getCommunityOverview(), { headers: { "Cache-Control": "no-store" } });
}
