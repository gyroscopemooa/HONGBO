import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** 별점 표시 (읽기 전용) */
export function StarRating({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`별점 5점 만점에 ${value}점`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} aria-hidden className={n <= value ? "fill-[#f5a623] text-[#f5a623]" : "fill-transparent text-[#d3d6dc]"} />
      ))}
    </span>
  );
}
