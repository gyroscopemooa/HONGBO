import { ArrowUpRight, Megaphone } from "lucide-react";
import { infl09ApplyUrl } from "@/lib/infl09";

/**
 * 인플09 연계 서비스 안내 배너 (유료 광고 배너와 별개의 서비스 안내 영역).
 * 신청·로그인·입금·진행 현황은 모두 인플09에서 처리합니다.
 * 전용 URL 이 확정되기 전에는 운영 화면에 노출하지 않고, 개발 환경에서만 비활성 미리보기로 보여줍니다.
 */
export function Infl09Banner({ className }: { className?: string }) {
  const url = infl09ApplyUrl();
  const preview = !url && process.env.NODE_ENV !== "production";
  if (!url && !preview) return null;

  const body = (
    <>
      <Megaphone
        aria-hidden
        size={96}
        strokeWidth={1.4}
        className="absolute -bottom-4 -right-3 rotate-[-10deg] opacity-[0.16] transition group-hover:scale-110 group-hover:opacity-30"
        style={{ color: "#5b3fc4" }}
      />
      <div className="relative">
        <p className="text-[15px] font-extrabold leading-snug tracking-[-0.035em] sm:text-base" style={{ color: "#4a2fb0" }}>
          인플루언서 협업 광고 신청하기
        </p>
        <p className="mt-1.5 text-[12.5px] leading-snug" style={{ color: "#5d4b9c" }}>
          우리 상품을 인플루언서 콘텐츠로 소개해 보세요. 샘플 제공으로 영상 1건 또는 라이브 홍보 1회를 진행할 수 있어요.
        </p>
        <p className="mt-2 text-[12px] font-semibold leading-snug" style={{ color: "#4a2fb0" }}>
          기본 콘텐츠 홍보 운영비 30,000원부터 · 샘플 제공 필수
        </p>
      </div>
      <span
        className="relative mt-3 inline-flex items-center justify-center gap-1 self-stretch rounded-xl px-3 py-2 text-[13.5px] font-bold text-white"
        style={{ background: url ? "#5b3fc4" : "#a79bd6" }}
      >
        {url ? "콘텐츠 홍보 신청하기" : "콘텐츠 홍보 신청하기 (주소 설정 전 미리보기)"}
        <ArrowUpRight size={16} aria-hidden />
      </span>
    </>
  );
  const cls = `group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl p-4 text-left transition duration-200 ${className ?? ""}`;
  const style = { background: "linear-gradient(135deg,#f1ecff 0%,#d9cffa 100%)" };

  return url ? (
    <a href={url} target="_blank" rel="noopener" className={`${cls} hover:-translate-y-0.5 hover:shadow-card`} style={style} aria-label="인플루언서 협업 광고 신청하기 (인플09로 이동)">
      {body}
    </a>
  ) : (
    <div className={cls} style={style} aria-disabled>
      {body}
    </div>
  );
}
