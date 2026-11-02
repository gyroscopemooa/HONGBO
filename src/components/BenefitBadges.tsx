import { benefitLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 혜택 배지 (이벤트·할인·쿠폰·무료·증정) */
export function BenefitBadges({ values, className }: { values?: string[]; className?: string }) {
  const labels = benefitLabels(values);
  if (!labels.length) return null;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {labels.map((l) => (
        <span key={l} className="rounded-md bg-[#e5484d] px-1.5 py-0.5 text-[11.5px] font-extrabold text-white shadow-sm">
          {l}
        </span>
      ))}
    </span>
  );
}
