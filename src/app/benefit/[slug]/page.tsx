import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BenefitPage } from "@/components/BenefitHub";
import { BENEFIT_PAGES, isBenefitSlug } from "@/lib/constants";
import { buildHref, parseListParams, type SearchParams } from "@/lib/listing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isBenefitSlug(slug)) return {};
  const info = BENEFIT_PAGES[slug];
  const p = parseListParams(await searchParams);
  return {
    title: info.title,
    description: info.desc,
    alternates: { canonical: buildHref(`/benefit/${slug}`, { sort: p.sort === "popular" ? "popular" : undefined, page: p.page > 1 ? p.page : undefined }) },
    openGraph: { title: info.title, description: info.desc, type: "website" },
  };
}

export default async function BenefitSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (!isBenefitSlug(slug)) notFound();
  return <BenefitPage slug={slug} params={parseListParams(await searchParams)} />;
}
