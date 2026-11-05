import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_MAP } from "@/lib/constants";
import type { AdCreative, Post } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BenefitBadges } from "./BenefitBadges";
import { NewBadge } from "./NewBadge";

export type AdBannerPost = Pick<Post, "id" | "title" | "shortDescription" | "primaryImageUrl" | "category" | "extra"> & { publishedAt?: string };

/**
 * 광고 배너 — 가로 4:1(데스크톱) / 2.2:1(모바일) 비율.
 * - creative 없음: 등록한 글의 대표 이미지·제목·한 줄 소개로 자동 제작
 * - creative.mode === "custom": 고객이 고른 사진과 직접 쓴 문구로 구성 (밝게/어둡게 선택)
 * - creative.mode === "upload": 고객이 만든 완성 배너 이미지를 그대로 노출
 * preview 가 true 면 링크 없이 미리보기로만 그립니다(신청 폼, 관리자 승인 화면).
 */
export function AdBanner({
  post,
  ad = true,
  creative,
  preview = false,
}: {
  post: AdBannerPost;
  ad?: boolean;
  creative?: AdCreative | null;
  preview?: boolean;
}) {
  const cat = CATEGORY_MAP[post.category];
  const frame =
    "group relative isolate block aspect-[2.2/1] transform-gpu overflow-hidden rounded-[20px] bg-soft ring-1 ring-black/[0.06] sm:aspect-[4/1]";
  const badge = (
    <span className="absolute left-3 top-3 z-10 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-ink-2">{ad ? "광고" : "NEW"}</span>
  );
  const wrap = (children: React.ReactNode) =>
    preview ? (
      <div className={frame}>{children}</div>
    ) : (
      <Link href={`/post/${post.id}`} aria-label={ad ? `${post.title} (광고)` : post.title} className={frame}>
        {children}
      </Link>
    );

  // 완성 배너 업로드: 고객 이미지를 그대로 (글자 겹치기 없음)
  if (creative?.mode === "upload" && creative.imageUrl) {
    return wrap(
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={creative.imageUrl} alt={post.title} className="absolute inset-0 size-full object-cover" loading="lazy" />
        {badge}
      </>,
    );
  }

  const custom = creative?.mode === "custom";
  const light = custom && creative?.tone === "light";
  const img = (custom && creative?.imageUrl) || post.primaryImageUrl || cat.defaultImage;
  const title = (custom && creative?.title) || post.title;
  const subtitle = custom ? creative?.subtitle || "" : post.shortDescription;

  return wrap(
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
      <div
        className={cn("absolute inset-0", light ? "bg-gradient-to-r from-white/95 via-white/75 to-white/10" : "bg-gradient-to-r from-black/80 via-black/50 to-black/5")}
        aria-hidden
      />
      {badge}
      <div className="relative flex h-full max-w-[78%] flex-col justify-center gap-1 px-4 sm:max-w-[62%] sm:px-8">
        <div className="flex items-center gap-1.5">
          <span className={cn("rounded-md px-1.5 py-0.5 text-[11.5px] font-bold backdrop-blur-sm", light ? "bg-black/10 text-ink-2" : "bg-white/20 text-white")}>{cat.name}</span>
          {ad && post.publishedAt && <NewBadge publishedAt={post.publishedAt} />}
          <BenefitBadges values={post.extra.benefits} />
        </div>
        <p className={cn("line-clamp-2 text-[17px] font-black leading-snug tracking-[-0.04em] sm:text-[26px]", light ? "text-ink" : "text-white")}>{title}</p>
        {subtitle && <p className={cn("line-clamp-1 text-[12.5px] sm:text-[14.5px]", light ? "text-ink-2" : "text-white/80")}>{subtitle}</p>}
      </div>
      <span className="absolute bottom-3 right-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-bold text-ink shadow-sm sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:px-4 sm:text-[14px]">
        자세히 보기 <ArrowUpRight size={15} aria-hidden />
      </span>
    </>,
  );
}
