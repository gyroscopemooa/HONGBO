import {
  CalendarCheck,
  Clapperboard,
  Gamepad2,
  LayoutGrid,
  Megaphone,
  Monitor,
  ShoppingBag,
  Handshake,
  Store,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CategorySlug } from "@/lib/constants";

export const CATEGORY_ICONS: Record<CategorySlug | "all", LucideIcon> = {
  all: LayoutGrid,
  apps: Gamepad2,
  websites: Monitor,
  services: Handshake,
  offline: Store,
  products: ShoppingBag,
  content: Clapperboard,
  events: CalendarCheck,
  free: Megaphone,
  quick: Zap,
};

export function CategoryIcon({
  slug,
  className,
  size = 20,
  strokeWidth = 2,
}: {
  slug: CategorySlug | "all";
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = CATEGORY_ICONS[slug];
  return <Icon className={className} size={size} strokeWidth={strokeWidth} aria-hidden />;
}
