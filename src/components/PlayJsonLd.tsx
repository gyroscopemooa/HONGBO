import { safeJsonLd } from "@/lib/play-seo";
export function PlayJsonLd({data}:{data:unknown}) {return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(data)}}/>;}
