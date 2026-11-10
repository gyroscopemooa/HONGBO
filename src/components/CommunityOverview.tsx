import { getCommunityOverview } from "@/lib/community-overview";
import { CommunityOverviewView } from "./CommunityOverviewView";
export async function CommunityOverview() {
  return <CommunityOverviewView initial={await getCommunityOverview()} />;
}
