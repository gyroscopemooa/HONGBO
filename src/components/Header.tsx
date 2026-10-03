import Link from "next/link";
import { LogIn, LogOut, PencilLine, Search, ShieldCheck, UserRound } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { Logo } from "./Logo";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-line bg-white">
      <div className="wrap flex h-[60px] items-center gap-3 sm:h-[68px] sm:gap-5">
        <div className="flex items-baseline gap-3">
          <Logo size="md" />
          <span className="hidden whitespace-nowrap text-[13px] text-muted xl:inline">{SITE.slogan}</span>
        </div>

        {/* 검색 (데스크톱) */}
        <form action="/search" role="search" className="mx-auto hidden w-full max-w-[420px] md:block">
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

        <nav aria-label="사용자 메뉴" className="ml-auto flex items-center gap-1 sm:gap-2 md:ml-0">
          <Link href="/search" aria-label="검색" className="flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-soft md:hidden">
            <Search size={20} aria-hidden />
          </Link>

          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                  <ShieldCheck size={16} aria-hidden />
                  관리
                </Link>
              )}
              <Link href="/mypage" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                내 홍보
              </Link>
              <Link href="/mypage" aria-label="내 홍보" className="flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-soft sm:hidden">
                <UserRound size={20} aria-hidden />
              </Link>
              <form action={signOutAction} className="hidden sm:block">
                <button type="submit" className="btn btn-ghost btn-sm">
                  <LogOut size={15} aria-hidden />
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                <LogIn size={15} aria-hidden />
                로그인
              </Link>
              <Link href="/auth" aria-label="로그인" className="flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-soft sm:hidden">
                <UserRound size={20} aria-hidden />
              </Link>
            </>
          )}

          <Link href="/write" className="btn btn-primary !px-3.5 !py-2.5 sm:!px-5">
            <PencilLine size={16} aria-hidden />
            글쓰기
          </Link>
        </nav>
      </div>
    </header>
  );
}
