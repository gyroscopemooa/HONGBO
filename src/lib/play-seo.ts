import type { Metadata } from "next";
import { playPhoto } from "@/data/play-photos";
import { playRegion } from "@/data/play-regions";
import { playPeriod, type PlayPlace } from "./play";
import { siteUrl } from "./utils";
export const absolutePlayUrl = (path: string) => new URL(path, siteUrl()).toString();
export const safeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
export function playMetadata(p: PlayPlace): Metadata {
 const title=`${p.title} · ${p.region} ${p.kind === "축제·행사" ? "일정·장소" : "위치·방문 안내"} | 놀러가자`;
 const description=`${p.summary} ${p.startDate ? playPeriod(p)+'. ' : ''}${p.address}. 비용과 방문 전 확인사항, 안내 출처를 확인하세요.`;
 const photo=playPhoto(p.slug);
 const images=photo ? [{url:photo.src,width:photo.width,height:photo.height,alt:photo.alt}] : undefined;
 return {title,description,alternates:{canonical:`/play/${p.slug}`},openGraph:{type:"website",locale:"ko_KR",title,description,url:`/play/${p.slug}`,images},twitter:{card:"summary_large_image",title,description,images:photo?[photo.src]:undefined}};
}
export function playBreadcrumbs(items: {name:string;path:string}[]) {
 return {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:items.map((item,i)=>({"@type":"ListItem",position:i+1,name:item.name,item:absolutePlayUrl(item.path)}))};
}
export function playDetailSchema(p:PlayPlace) {
 const url=absolutePlayUrl(`/play/${p.slug}`);const photo=playPhoto(p.slug);const region=playRegion(p.region);
 // Reference subjects and unidentified supplied images must not represent an event in search.
 const image=photo && !photo.label?.includes("참고") ? absolutePlayUrl(photo.src) : undefined;
 const entity = p.kind==="축제·행사" ? (!p.schedulePending && p.startDate ? {"@type":"Event",name:p.title,description:p.summary,url,startDate:p.startDate,endDate:p.endDate||p.startDate,location:{"@type":"Place",name:p.area,address:{"@type":"PostalAddress",streetAddress:p.address,addressCountry:"KR"}},image} : undefined) : {"@type":p.kind==="숙소"?"Place":"TouristAttraction",name:p.title,description:p.summary,url,image,address:{"@type":"PostalAddress",streetAddress:p.address,addressCountry:"KR"}};
 return {"@context":"https://schema.org","@graph":[{"@type":"WebPage","@id":url,url,name:p.title,description:p.summary,inLanguage:"ko-KR",dateModified:p.checkedAt,citation:p.source,...(entity?{mainEntity:entity}:{})},playBreadcrumbs([{name:"놀러가자",path:"/play"},...(region?[{name:region.name,path:`/play/region/${region.slug}`}]:[]),{name:p.title,path:`/play/${p.slug}`}])]};
}
export function playListSchema(name:string,path:string,places:PlayPlace[]) {
 return {"@context":"https://schema.org","@type":"CollectionPage",name,url:absolutePlayUrl(path),inLanguage:"ko-KR",mainEntity:{"@type":"ItemList",numberOfItems:places.length,itemListElement:places.map((p,i)=>({"@type":"ListItem",position:i+1,name:p.title,url:absolutePlayUrl(`/play/${p.slug}`)}))}};
}
