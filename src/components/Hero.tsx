import Link from "next/link";
import { ArrowRight, Gift, LayoutGrid, SquarePen } from "lucide-react";
import { HeroArt } from "./HeroArt";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-gradient-to-br from-[#eaf2fb] via-[#f3f8fd] to-[#e8f0fa]">
      <div className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-white/60 blur-3xl" aria-hidden />
      <div className="wrap relative grid items-center gap-2 lg:min-h-[320px] lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)]">
        <div className="py-8 sm:py-10 lg:py-12">
          <h1 id="hero-title" className="text-[30px] font-black leading-[1.22] tracking-[-0.045em] text-ink sm:text-[40px] lg:text-[44px]">
            홍보하고, 알려보세요!
            <br />
            <span className="text-brand">더 많은 사람들에게, 더홍보</span>
          </h1>
          <p className="mt-4 max-w-[34em] text-[15px] leading-relaxed text-ink-2 sm:text-base">
            앱, 사이트, 가게, 상품, 서비스… 무엇이든 자유롭게 홍보할 수 있는 공간!
            <br className="hidden sm:block" /> 지금 바로 글을 작성하고, 당신의 이야기를 알려보세요.
          </p>
          <Link href="/write" className="btn btn-primary btn-lg mt-6 !rounded-[10px] !px-7">
            지금 홍보글 작성하기
            <ArrowRight size={18} aria-hidden />
          </Link>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-ink-2">
            <li className="inline-flex items-center gap-1.5">
              <Gift size={16} className="text-brand" aria-hidden /> 누구나 무료로
            </li>
            <li className="inline-flex items-center gap-1.5">
              <LayoutGrid size={16} className="text-brand" aria-hidden /> 카테고리 제한 없이
            </li>
            <li className="inline-flex items-center gap-1.5">
              <SquarePen size={16} className="text-brand" aria-hidden /> 간단한 작성으로 OK!
            </li>
          </ul>
        </div>
        <div className="relative -mb-px hidden self-end sm:block">
          <p className="absolute right-3 top-6 -rotate-3 text-[17px] font-semibold italic text-ink-2 lg:right-6 lg:top-8">
            좋은 건, 널리 알려야 하니까! <span className="text-brand">♥</span>
          </p>
          <HeroArt className="hb-float mx-auto block h-auto w-full max-w-[620px] pt-10 [animation-duration:6s]" />
        </div>
      </div>
    </section>
  );
}
