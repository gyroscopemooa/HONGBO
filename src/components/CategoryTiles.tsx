import Link from "next/link";
import { ArrowRight, BadgePercent, Gift, PartyPopper, PencilLine, Sparkles, Ticket, type LucideIcon } from "lucide-react";
import { BENEFITS, BENEFIT_PAGES, CATEGORIES, type CategorySlug } from "@/lib/constants";
import { CategoryIcon } from "./CategoryIcon";

const BENEFIT_ICONS: Record<string, LucideIcon> = { event: PartyPopper, discount: BadgePercent, coupon: Ticket, free: Sparkles, gift: Gift };

type Tile = { slug: string; name: string; color: string; tint: string; href: string; icon?: React.ReactNode };
const ALL_TILE: Tile = { slug: "all", name: "전체", color: "#f04f4a", tint: "#fff0ef", href: "/posts" };

export function CategoryTiles() {
  const tiles: Tile[] = [
    ALL_TILE,
    ...CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, color: c.color, tint: c.tint, href: `/category/${c.slug}` })),
    ...BENEFITS.map((b) => {
      const info = BENEFIT_PAGES[b.value];
      const Icon = BENEFIT_ICONS[b.value];
      return { slug: `benefit-${b.value}`, name: info.label, color: info.color, tint: info.tint, href: `/benefit/${b.value}`, icon: <Icon size={28} strokeWidth={2.1} aria-hidden /> };
    }),
    { slug: "benefit-all", name: "이벤트 모음", color: "#f04f4a", tint: "#fff0ef", href: "/benefit", icon: <Gift size={28} strokeWidth={2.1} aria-hidden /> },
  ];
  return (
    <section aria-label="카테고리 바로가기" className="wrap grid gap-3 py-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-4 lg:py-6">
      <ul className="grid min-w-0 grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-2.5">
        {tiles.map((t) => (
          <li key={t.slug}>
            <Link
              href={t.href}
              className="group flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-3 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-card sm:py-4"
              style={{ background: t.tint }}
            >
              <span className="flex size-9 items-center justify-center sm:size-10" style={{ color: t.color }}>
                {t.icon ?? <CategoryIcon slug={t.slug as CategorySlug | "all"} size={28} strokeWidth={2.1} />}
              </span>
              <span className="text-[11.5px] font-bold leading-tight tracking-[-0.03em] text-ink-2 sm:text-[12.5px]">{t.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-col justify-center rounded-2xl border border-brand-line bg-gradient-to-br from-brand-soft to-[#fff7f6] p-4">
        <p className="text-[15px] font-extrabold tracking-[-0.03em] text-ink">지금, 당신의 홍보를 시작하세요!</p>
        <p className="mt-1 text-[12.5px] text-muted">간단한 글쓰기만으로 수많은 사람들에게 노출됩니다.</p>
        <Link href="/write" className="btn btn-primary mt-3 w-full">
          <PencilLine size={16} aria-hidden />
          홍보글 작성하기
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
