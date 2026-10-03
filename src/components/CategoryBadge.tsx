import { CATEGORY_MAP, type CategorySlug } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CategoryBadge({ slug, className }: { slug: CategorySlug; className?: string }) {
  const c = CATEGORY_MAP[slug];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11.5px] font-bold leading-tight", className)}
      style={{ color: c.color, background: c.tint }}
    >
      {c.name}
    </span>
  );
}
