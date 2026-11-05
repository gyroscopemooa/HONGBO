import type { Metadata } from "next";
import { BENEFIT_HUB, BenefitPage } from "@/components/BenefitHub";
import { parseListParams, buildHref, type SearchParams } from "@/lib/listing";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = parseListParams(await searchParams);
  return {
    title: BENEFIT_HUB.title,
    description: BENEFIT_HUB.desc,
    keywords: ["이벤트 모음", "이벤트 사이트", "진행중인 이벤트", "할인 쿠폰 모음", "무료 체험", "이벤트 헌터", "이벤트 참여"],
    alternates: { canonical: buildHref("/benefit", { sort: p.sort === "popular" ? "popular" : undefined, page: p.page > 1 ? p.page : undefined }) },
    openGraph: { title: BENEFIT_HUB.title, description: BENEFIT_HUB.desc, type: "website" },
  };
}

export default async function BenefitHubPage({ searchParams }: Props) {
  return <BenefitPage params={parseListParams(await searchParams)} />;
}
