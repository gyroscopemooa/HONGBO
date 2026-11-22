import { PRODUCT_SOURCE_LABELS, type ProductSource } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 상품 판매 형태를 카드와 상세에 동일하게 보여주는 배지입니다. */
export function ProductSourceBadge({ value, className }: { value?: ProductSource; className?: string }) {
  if (!value) return null;
  return <span className={cn("inline-flex shrink-0 items-center rounded-md bg-[#f3edff] px-1.5 py-0.5 text-[11.5px] font-bold leading-tight text-[#7043a8]", className)}>{PRODUCT_SOURCE_LABELS[value]}</span>;
}
