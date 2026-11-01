import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { requireUser } from "@/lib/auth";
import { listFavoriteIds } from "@/lib/favorites-store";
import { isPostPublic } from "@/lib/queries";
import { store } from "@/lib/store";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "내 찜", robots: { index: false, follow: false } };

export default async function FavoritesPage() {
  const user = await requireUser("/mypage/favorites");
  const ids = await listFavoriteIds(user.id).catch((error) => {
    console.error("favorites list failed", error);
    return [] as number[];
  });
  const posts = (await Promise.all(ids.map((id) => store.getPost(id)))).filter((p): p is Post => !!p && isPostPublic(p));

  return (
    <div className="wrap py-6 sm:py-9">
      <header className="mb-6">
        <h1 className="text-[26px] font-black tracking-[-0.045em] sm:text-[32px]">내 찜</h1>
        <p className="mt-1.5 text-[15px] text-muted">찜한 홍보글은 나만 볼 수 있어요. 노출 기간이 끝났거나 삭제된 글은 보이지 않아요.</p>
      </header>
      {posts.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {posts.map((p) => (
            <li key={p.id}>
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-soft/60 px-6 py-14 text-center">
          <p className="text-lg font-bold">아직 찜한 홍보글이 없어요</p>
          <p className="mt-1 text-sm text-muted">마음에 드는 홍보글 상세 페이지에서 &lsquo;찜하기&rsquo;를 눌러보세요.</p>
          <Link href="/posts" className="btn btn-primary mt-5">
            홍보글 둘러보기
          </Link>
        </div>
      )}
    </div>
  );
}
