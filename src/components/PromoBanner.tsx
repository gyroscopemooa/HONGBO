import Link from "next/link";
import { ArrowUpRight, Layers, Megaphone, Rocket, Smartphone, Store, type LucideIcon } from "lucide-react";
import type { Banner } from "@/lib/types";
import { cn } from "@/lib/utils";

const THEMES: Record<Banner["theme"], { bg: string; fg: string; sub: string; Icon: LucideIcon }> = {
  coral: { bg: "linear-gradient(135deg,#fff2f1 0%,#ffd9d6 100%)", fg: "#cf3530", sub: "#a85552", Icon: Megaphone },
  blue: { bg: "linear-gradient(135deg,#eef4ff 0%,#d3e2ff 100%)", fg: "#2455c9", sub: "#4a6aa8", Icon: Smartphone },
  mint: { bg: "linear-gradient(135deg,#e9f9f3 0%,#c3eedd 100%)", fg: "#0e7a63", sub: "#3f7f6f", Icon: Store },
  violet: { bg: "linear-gradient(135deg,#f3edff 0%,#ddd0ff 100%)", fg: "#5f35c9", sub: "#7a64ad", Icon: Layers },
  amber: { bg: "linear-gradient(135deg,#fff6e0 0%,#ffe1a6 100%)", fg: "#a96300", sub: "#9a7228", Icon: Rocket },
};

export function PromoBanner({ banner, className }: { banner: Banner; className?: string }) {
  const t = THEMES[banner.theme] ?? THEMES.coral;
  const external = /^https?:\/\//i.test(banner.targetUrl);
  const body = (
    <>
      {banner.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner.imageUrl} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
      ) : (
        <t.Icon
          aria-hidden
          size={92}
          strokeWidth={1.4}
          className="absolute -bottom-3 -right-2 rotate-[-10deg] opacity-[0.18] transition group-hover:scale-110 group-hover:opacity-30"
          style={{ color: t.fg }}
        />
      )}
      <div className="relative">
        <p className="text-[15px] font-extrabold leading-snug tracking-[-0.035em] sm:text-base" style={{ color: banner.imageUrl ? "#fff" : t.fg }}>
          {banner.title}
        </p>
        {banner.subtitle && (
          <p className="mt-1 text-[12.5px] leading-snug" style={{ color: banner.imageUrl ? "#ffffffcc" : t.sub }}>
            {banner.subtitle}
          </p>
        )}
      </div>
      <ArrowUpRight size={18} aria-hidden className="relative mt-2 self-end opacity-60" style={{ color: banner.imageUrl ? "#fff" : t.fg }} />
    </>
  );
  const cls = cn(
    "group relative flex min-h-[104px] flex-col justify-between overflow-hidden rounded-2xl p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-card",
    className,
  );
  if (external) {
    return (
      <a href={banner.targetUrl} target="_blank" rel="noopener noreferrer" className={cls} style={{ background: t.bg }}>
        {body}
      </a>
    );
  }
  return (
    <Link href={banner.targetUrl} className={cls} style={{ background: t.bg }}>
      {body}
    </Link>
  );
}
