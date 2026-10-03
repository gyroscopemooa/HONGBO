import Image from "next/image";
import { CATEGORY_MAP, type CategorySlug } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * 모든 카드/상세에서 같은 16:9 비율로 이미지를 보여줍니다.
 * 대표 이미지가 없으면 카테고리 기본 이미지를 사용합니다.
 */
export function PostImage({
  src,
  alt,
  category,
  sizes,
  className,
  eager = false,
}: {
  src: string | null | undefined;
  alt: string;
  category: CategorySlug;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  const url = src || CATEGORY_MAP[category].defaultImage;
  const local = url.startsWith("/");
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-soft", className)}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes={sizes}
        // 내 서버의 정적/업로드 파일(SVG 포함)은 최적화 없이 그대로, 외부 스토리지 이미지는 Next 이미지 최적화를 사용
        unoptimized={local}
        loading={eager ? "eager" : "lazy"}
        className="object-cover"
      />
    </div>
  );
}
