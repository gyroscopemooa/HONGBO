import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const base = "flex size-10 items-center justify-center rounded-lg border text-sm font-semibold transition";
  return (
    <nav aria-label="페이지 이동" className="mt-8 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} aria-label="이전 페이지" className={cn(base, "border-line bg-white text-ink-2 hover:border-brand hover:text-brand")}>
          <ChevronLeft size={18} aria-hidden />
        </Link>
      ) : (
        <span className={cn(base, "border-line bg-soft text-faint")} aria-hidden>
          <ChevronLeft size={18} />
        </span>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(base, p === page ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2 hover:border-brand hover:text-brand")}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} aria-label="다음 페이지" className={cn(base, "border-line bg-white text-ink-2 hover:border-brand hover:text-brand")}>
          <ChevronRight size={18} aria-hidden />
        </Link>
      ) : (
        <span className={cn(base, "border-line bg-soft text-faint")} aria-hidden>
          <ChevronRight size={18} />
        </span>
      )}
    </nav>
  );
}
