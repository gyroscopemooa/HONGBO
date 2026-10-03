import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const stats = await store.stats();
  const links: Array<[string, string, number?]> = [
    ["/admin", "대시보드"],
    ["/admin/posts", "홍보글"],
    ["/admin/reports", "신고", stats.openReports],
    ["/admin/users", "사용자"],
    ["/admin/banners", "배너"],
    ["/admin/notices", "공지"],
  ];
  return (
    <div className="wrap py-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="mr-2 text-[24px] font-black tracking-[-0.04em]">관리자</h1>
        <nav aria-label="관리자 메뉴" className="no-scrollbar -mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1">
          {links.map(([href, label, n]) => (
            <Link key={href} href={href} className="btn btn-outline btn-sm shrink-0">
              {label}
              {n ? <span className="ml-0.5 rounded-full bg-brand px-1.5 text-[11px] font-bold leading-[18px] text-white">{n}</span> : null}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
