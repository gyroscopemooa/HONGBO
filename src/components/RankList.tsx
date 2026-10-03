import Link from "next/link";
import { Trophy } from "lucide-react";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RankList({ posts, title = "실시간 인기글" }: { posts: Post[]; title?: string }) {
  return (
    <section aria-label={title} className="h-full min-w-0 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.04em]">
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Trophy size={16} aria-hidden />
        </span>
        {title}
      </h2>
      <ol className="space-y-0.5">
        {posts.slice(0, 10).map((p, i) => (
          <li key={p.id}>
            <Link href={`/post/${p.id}`} className="group flex items-center gap-3 rounded-lg px-1.5 py-[7px] hover:bg-soft">
              <span
                className={cn(
                  "flex size-[22px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
                  i < 3 ? "bg-brand text-white" : "bg-soft text-muted",
                )}
              >
                {i + 1}
              </span>
              <span className="truncate text-[14px] font-medium text-ink-2 group-hover:text-brand-dark">{p.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
