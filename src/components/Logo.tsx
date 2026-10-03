import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, size = "md", href = "/" }: { className?: string; size?: "sm" | "md" | "lg"; href?: string | null }) {
  const cls = cn(
    "inline-flex items-baseline font-black leading-none tracking-[-0.06em]",
    size === "lg" ? "text-[40px]" : size === "md" ? "text-[30px]" : "text-[22px]",
    className,
  );
  const inner = (
    <>
      <span className="text-ink">더</span>
      <span className="text-brand">홍보</span>
    </>
  );
  if (href === null) return <span className={cls}>{inner}</span>;
  return (
    <Link href={href} className={cls} aria-label="더홍보 홈">
      {inner}
    </Link>
  );
}
