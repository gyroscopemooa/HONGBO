import Link from "next/link";
import { Crown } from "lucide-react";
import { getTopAds } from "@/lib/queries";
import { PostCard } from "./PostCard";

/** 전체 홍보글·카테고리 목록 맨 위에 보이는 "추천 홍보"(유료 상단 고정). 카테고리 페이지에서는 그 카테고리의 광고만 나옵니다. */
export async function TopAds({ category }: { category?: string }) {
  const ads = await getTopAds("premium", category);
  if (!ads.length) return null;
  return (
    <section aria-label="추천 홍보" className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.04em]">
          <Crown size={19} className="text-[#e0a100]" fill="currentColor" aria-hidden /> 추천 홍보
        </h2>
        <Link href="/advertise" className="text-[13px] font-medium text-muted hover:text-brand">
          상단 고정 신청하기
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {ads.map((p) => (
          <li key={p.id}>
            <PostCard post={p} ad />
          </li>
        ))}
      </ul>
    </section>
  );
}
