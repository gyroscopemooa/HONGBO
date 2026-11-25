import Link from "next/link";
import { Bell, LogIn, LogOut, PencilLine, Search, ShieldCheck, UserRound } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";
import { unreadMemberNotificationCount } from "@/lib/member-community-store";
import { SITE } from "@/lib/constants";
import { Logo } from "./Logo";

export async function Header() {
  const user = await getCurrentUser();
  const unread = user ? await unreadMemberNotificationCount(user.id).catch(() => 0) : 0;

  return (
    <header className="relative z-50 border-b border-line bg-white">
      <div className="wrap flex h-[60px] min-w-0 items-center gap-1 sm:h-[68px] md:gap-5">
        <div className="flex min-w-0 items-baseline gap-3">
          <Logo size="md" className="max-md:text-[22px]!" />
          <span className="hidden whitespace-nowrap text-[13px] text-muted xl:inline">{SITE.slogan}</span>
        </div>

        {/* 검색 (데스크톱) */}
        <form action="/search" role="search" className="mx-auto hidden min-w-0 flex-1 max-w-[420px] md:block">
          <label htmlFor="hb-search" className="sr-only">
            홍보 검색
          </label>
          <div className="relative">
            <input
              id="hb-search"
              name="q"
              type="search"
              maxLength={60}
              placeholder="무엇을 찾고 있나요?"
              autoComplete="off"
              className="h-11 w-full rounded-full border border-line bg-soft pl-5 pr-12 text-[14.5px] transition placeholder:text-faint hover:border-[#cfd4de] focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
            <button
              type="submit"
              aria-label="검색"
              className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-white hover:text-brand"
            >
              <Search size={18} aria-hidden />
            </button>
          </div>
        </form>

        <nav aria-label="사용자 메뉴" className="ml-auto flex shrink-0 items-center gap-0.5 md:ml-0 md:gap-2">
          <Link href="/search" aria-label="검색" className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-soft md:hidden">
            <Search size={20} aria-hidden />
          </Link>

          {user ? (
            <>
              <Link href="/talk/notifications" aria-label="커뮤니티 알림" title="커뮤니티 알림" className="relative flex size-8 md:size-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-soft"><Bell size={18} aria-hidden />{unread > 0 && <span className="absolute right-0 top-0 rounded-full bg-brand px-1 text-[10px] text-white">{unread > 99 ? "99+" : unread}<span className="sr-only">개의 읽지 않은 알림</span></span>}</Link>
              {user.isAdmin && (
                <Link href="/admin" aria-label="관리자" title="관리자" className="hidden shrink-0 items-center justify-center rounded-lg px-3 py-2 text-ink-2 hover:bg-soft md:flex md:gap-1.5">
                  <ShieldCheck size={16} aria-hidden />
                  <span className="hidden md:inline">관리</span>
                </Link>
              )}
              <Link href="/mypage" className="btn btn-ghost btn-sm hidden! md:inline-flex!">
                내 홍보
              </Link>
              <details className="group relative md:hidden">
                <summary aria-label="계정 메뉴" className="flex size-8 cursor-pointer list-none items-center justify-center rounded-full text-ink-2 hover:bg-soft [&::-webkit-details-marker]:hidden">
                  <UserRound size={20} aria-hidden />
                </summary>
                <div className="absolute right-0 top-full z-[60] mt-2 w-44 rounded-xl border border-line bg-white p-1.5 shadow-pop">
                  <Link href="/mypage" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-2 hover:bg-soft">내 홍보</Link>
                  {user.isAdmin && (
                    <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-2 hover:bg-soft">
                      <ShieldCheck size={15} aria-hidden /> 관리
                    </Link>
                  )}
                  <form action={signOutAction} className="mt-1 border-t border-line pt-1">
                    <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink-2 hover:bg-soft">
                      <LogOut size={15} aria-hidden /> 로그아웃
                    </button>
                  </form>
                </div>
              </details>
              <form action={signOutAction} className="hidden md:block">
                <button type="submit" className="btn btn-ghost btn-sm">
                  <LogOut size={15} aria-hidden />
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth" className="btn btn-ghost btn-sm hidden! md:inline-flex!">
                <LogIn size={15} aria-hidden />
                로그인
              </Link>
              <Link href="/auth" aria-label="로그인" className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-soft md:hidden">
                <UserRound size={20} aria-hidden />
              </Link>
            </>
          )}

          <Link href="/write" className="btn btn-primary shrink-0 !gap-1 !px-2 !py-2 max-md:!text-[12px] md:!px-5">
            <PencilLine size={16} aria-hidden />
            글쓰기
          </Link>
        </nav>
      </div>
    </header>
  );
}
