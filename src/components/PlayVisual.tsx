import Image from "next/image";
import { playPhoto } from "@/data/play-photos";
import type { PlayPlace } from "@/lib/play";
import { PlayArt } from "./PlayArt";

export function PlayVisual({ place, className = "", eager = false }: { place: Pick<PlayPlace, "slug" | "art">; className?: string; eager?: boolean }) {
  const photo = playPhoto(place.slug);
  return photo ? <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} unoptimized loading={eager ? "eager" : "lazy"} className={`play-photo ${className}`}/> : <PlayArt art={place.art} className={className}/>;
}
