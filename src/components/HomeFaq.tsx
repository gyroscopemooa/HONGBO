import Link from "next/link";
import { CATEGORIES, SITE } from "@/lib/constants";

/** 홈 하단 소개 + 자주 묻는 질문. 검색엔진이 읽을 수 있는 본문 텍스트(홍보사이트·무료홍보 등)를 제공합니다. */
export const HOME_FAQ = [
  {
    q: "더홍보는 어떤 홍보 사이트인가요?",
    a: `${SITE.name}는 앱, 웹사이트, 가게, 상품, 서비스, 콘텐츠, 이벤트까지 무엇이든 무료로 홍보할 수 있는 홍보 사이트입니다. 홍보글을 올리면 카테고리·지역·인기순으로 노출되어 더 많은 사람이 발견할 수 있어요.`,
  },
  {
    q: "정말 무료로 홍보할 수 있나요?",
    a: "네. 홍보글 등록은 무료입니다. 로그인 후 제목, 소개, 이미지, 링크만 입력하면 바로 무료 홍보가 시작됩니다.",
  },
  {
    q: "어떤 것을 홍보할 수 있나요?",
    a: `${CATEGORIES.map((c) => c.name).join(", ")} 등 운영정책에 어긋나지 않는 것이라면 마음껏 홍보할 수 있어요. 직접 만든 앱이나 사이트, 동네 가게, 판매 상품, 유튜브·블로그 콘텐츠 모두 환영합니다.`,
  },
  {
    q: "마케팅 사이트로 어떻게 활용하면 좋을까요?",
    a: "대표 이미지와 한 줄 소개를 눈에 띄게 작성하고, 설치·구매·방문 링크를 함께 넣어 주세요. 상세 설명에 핵심 키워드를 자연스럽게 담으면 검색으로 들어오는 방문자도 늘어납니다.",
  },
] as const;

export function HomeFaq() {
  return (
    <section aria-labelledby="home-about" className="wrap pt-10">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">
        <h2 id="home-about" className="text-[19px] font-extrabold tracking-[-0.04em]">
          마음껏 홍보 가능한 무료 홍보 사이트, {SITE.name}
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
          홍보할 곳을 찾고 계셨나요? {SITE.name}는 누구나 무료로 홍보글을 올리는 홍보 게시판이자 마케팅 사이트입니다.
          광고비 걱정 없이 내 앱·사이트·가게·상품을 알리고, 다른 사람들의 새로운 서비스도 발견해 보세요.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2 text-[13px]">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} className="inline-block rounded-full bg-slate-100 px-3 py-1 font-medium text-ink-2 hover:text-brand">
                {c.name} 무료 홍보
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-7 text-[17px] font-extrabold tracking-[-0.04em]">자주 묻는 질문</h2>
        <dl className="mt-2 divide-y divide-line/60">
          {HOME_FAQ.map((f) => (
            <div key={f.q} className="py-3">
              <dt className="text-[14.5px] font-bold text-ink">{f.q}</dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
        <Link href="/write" className="btn btn-primary mt-4">
          지금 무료로 홍보하기
        </Link>
      </div>
    </section>
  );
}
