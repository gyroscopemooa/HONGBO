import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_MAP } from "@/lib/constants";
import type { Post } from "@/lib/types";
import { BenefitBadges } from "./BenefitBadges";

/**
 * 광고 배너 — 고객이 이미지를 따로 만들 필요 없이, 등록한 글의 대표 이미지·제목·한 줄 소개로 자동 구성합니다.
 * 가로 4:1(데스크톱) / 2.2:1(모바일) 비율로 고정하고, 글자는 어두운 그라데이션 위에 올려 어떤 이미지에서도 읽히게 합니다.
 */
export function AdBanner({ post, ad = true }: { post: Post; ad?: boolean }) {
  const cat = CATEGORY_MAP[post.category];
  const img = post.primaryImageUrl || cat.defaultImage;
  return (
    <Link
      href={`/post/${post.id}`}
      aria-label={ad ? `${post.title} (광고)` : post.title}
      className="group relative block aspect-[2.2/1] overflow-hidden rounded-2xl bg-ink sm:aspect-[4/1]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/5" aria-hidden />
      <span className="absolute left-3 top-3 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-ink-2">{ad ? "광고" : "NEW"}</span>
      <div className="relative flex h-full max-w-[78%] flex-col justify-center gap-1 px-4 sm:max-w-[62%] sm:px-8">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[11.5px] font-bold text-white backdrop-blur-sm">{cat.name}</span>
          <BenefitBadges values={post.extra.benefits} />
        </div>
        <p className="line-clamp-2 text-[17px] font-black leading-snug tracking-[-0.04em] text-white sm:text-[26px]">{post.title}</p>
        <p className="line-clamp-1 text-[12.5px] text-white/80 sm:text-[14.5px]">{post.shortDescription}</p>
      </div>
      <span className="absolute bottom-3 right-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-bold text-ink shadow-sm sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:px-4 sm:text-[14px]">
        자세히 보기 <ArrowUpRight size={15} aria-hidden />
      </span>
    </Link>
  );
}
