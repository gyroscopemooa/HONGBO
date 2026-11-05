import { EXCLUSIVE_LABEL, EXCLUSIVE_SLUG, benefitLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 혜택 배지 (이벤트·할인·쿠폰·무료·증정 + 더홍보 전용) */
export function BenefitBadges({ values, className }: { values?: string[]; className?: string }) {
  const labels = benefitLabels(values);
  const exclusive = !!values?.includes(EXCLUSIVE_SLUG);
  if (!labels.length && !exclusive) return null;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {exclusive && (
        <span className="rounded-md bg-gradient-to-r from-[#a86a0b] via-[#f0b429] to-[#a86a0b] px-1.5 py-0.5 text-[11.5px] font-extrabold text-white shadow-[0_2px_8px_rgba(168,106,11,0.55)] ring-1 ring-white/60">★ {EXCLUSIVE_LABEL}</span>
      )}
      {labels.map((l) => (
        <span key={l} className="rounded-md bg-[#e5484d] px-1.5 py-0.5 text-[11.5px] font-extrabold text-white shadow-sm">
          {l}
        </span>
      ))}
    </span>
  );
}
