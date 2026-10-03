import Link from "next/link";
import { PencilLine, SearchX } from "lucide-react";

export function EmptyState({
  title = "아직 등록된 홍보글이 없어요",
  description = "첫 번째 홍보글의 주인공이 되어보세요.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-soft/60 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-white text-faint shadow-card">
        <SearchX size={26} aria-hidden />
      </span>
      <p className="mt-4 text-lg font-bold tracking-[-0.03em]">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <Link href="/write" className="btn btn-primary mt-5">
        <PencilLine size={16} aria-hidden />
        홍보글 작성하기
      </Link>
    </div>
  );
}
