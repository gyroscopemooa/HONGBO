import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { devLoginAction } from "./actions";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { Logo } from "@/components/Logo";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { devLoginEnabled, supabaseConfigured } from "@/lib/env";
import { pickFirst } from "@/lib/utils";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AuthPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNext(pickFirst(sp.next));
  const failed = pickFirst(sp.error);

  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <div className="wrap flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-[420px] rounded-3xl border border-line bg-white p-7 shadow-card sm:p-9">
        <div className="text-center">
          <Logo size="lg" href={null} />
          <h1 className="mt-5 text-[21px] font-extrabold tracking-[-0.04em]">로그인하고 홍보를 시작하세요</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            둘러보기와 링크 이동은 로그인 없이도 가능해요.
            <br />
            홍보글을 쓰고 관리할 때만 로그인하면 돼요.
          </p>
        </div>

        {failed && (
          <p role="alert" className="mt-5 rounded-xl bg-brand-soft px-4 py-3 text-center text-[13.5px] font-medium text-brand-dark">
            로그인에 실패했어요. 다시 시도해주세요.
          </p>
        )}

        <div className="mt-7">
          {supabaseConfigured() ? (
            <GoogleLoginButton next={next} />
          ) : devLoginEnabled() ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-[#f5d9a8] bg-[#fff8ea] p-3 text-[12.5px] leading-relaxed text-[#8a5a00]">
                <FlaskConical size={16} className="mt-0.5 shrink-0" aria-hidden />
                <p>
                  <b>로컬 미리보기 모드</b>예요. Supabase 환경변수가 설정되면 이 화면이 &lsquo;Google로 계속하기&rsquo; 버튼으로 바뀌어요.
                </p>
              </div>
              <form action={devLoginAction} className="space-y-2.5">
                <input type="hidden" name="next" value={next} />
                <button type="submit" name="uid" value="dev-user" className="btn btn-primary btn-lg w-full">
                  테스트 회원으로 로그인
                </button>
                <button type="submit" name="uid" value="dev-admin" className="btn btn-outline btn-lg w-full">
                  테스트 관리자로 로그인
                </button>
              </form>
            </div>
          ) : (
            <p className="rounded-xl bg-soft p-4 text-center text-[14px] text-muted">로그인 기능을 준비하고 있어요. 조금만 기다려주세요.</p>
          )}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-faint">
          계속하면 <a href="/terms" className="underline">이용약관</a> 및 <a href="/privacy" className="underline">개인정보처리방침</a>에 동의한 것으로 봅니다.
          <br />
          Google 이름과 이메일은 홍보글에 공개되지 않아요.
        </p>
      </div>
    </div>
  );
}
