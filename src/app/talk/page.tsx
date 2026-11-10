import Link from "next/link";
import { listMemberPosts } from "@/lib/member-community-store";
import { MEMBER_CATEGORIES, MEMBER_PURPOSES } from "@/lib/member-community";
import { Pagination } from "@/components/Pagination";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "회원 커뮤니티 · 테스트와 경험 나누기",
  description:
    "앱, 웹, 게임, 가게, 제품까지 함께 테스트하고 솔직한 피드백을 나누는 더홍보 회원 커뮤니티",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const one = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : "";
  const query = one(p.q).slice(0, 60);
  const category = one(p.category);
  const purpose = one(p.purpose);
  const page = Math.max(1, Math.min(10000, Math.trunc(Number(one(p.page))) || 1));
  const { items, total } = await listMemberPosts({
    page,
    query,
    category,
    purpose,
  });
  return (
    <div className="wrap max-w-[1000px] py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">회원 커뮤니티</h1>
          <p className="mt-2 text-muted">
            앱부터 동네 가게·제품까지, 함께 써보고 이야기해요.
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-outline" href="/talk/notifications">
            내 알림
          </Link>
          <Link className="btn btn-primary" href="/talk/write">
            글쓰기
          </Link>
        </div>
      </div>
      <p className="my-5 rounded-xl bg-soft p-4 text-sm">
        모집만 하고 끝내지 말고, 댓글에 답하고 진행 상황과 후기를 나눠주세요.{" "}
        <Link className="underline" href="/community">
          운영자 가이드
        </Link>
        는 별도 공간입니다.
      </p>
      <form
        className="mb-5 grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]"
        action="/talk"
      >
        <select
          aria-label="대상 필터"
          name="category"
          defaultValue={category}
          className="field min-w-0"
        >
          <option value="">모든 대상</option>
          {MEMBER_CATEGORIES.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
        <select
          aria-label="주제 필터"
          name="purpose"
          defaultValue={purpose}
          className="field min-w-0"
        >
          <option value="">모든 주제</option>
          {MEMBER_PURPOSES.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
        <input
          name="q"
          aria-label="커뮤니티 검색"
          placeholder="제목·내용 검색"
          defaultValue={query}
          maxLength={60}
          className="field min-w-0"
        />
        <button className="btn btn-outline">찾기</button>
      </form>
      <p className="mb-2 text-sm text-muted">{total}개의 이야기</p>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {items.map((post) => (
          <li key={post.id}>
            <Link className="block p-4 hover:bg-soft" href={`/talk/${post.id}`}>
              <p className="text-xs text-muted">
                {
                  MEMBER_CATEGORIES.find((x) => x.value === post.category)
                    ?.label
                }{" "}
                · {MEMBER_PURPOSES.find((x) => x.value === post.purpose)?.label}
                {post.closed ? " · 모집 마감" : ""}
              </p>
              <h2 className="mt-1 break-words font-bold">{post.title}</h2>
              <p className="mt-1 line-clamp-2 break-words text-sm text-muted">
                {post.body}
              </p>
              <p className="mt-2 text-xs text-muted">
                {post.nickname} ·{" "}
                {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {!items.length && (
        <p className="py-12 text-center text-muted">
          아직 글이 없어요. 첫 이야기를 시작해보세요.
        </p>
      )}
      <Pagination
        page={page}
        totalPages={Math.ceil(total / 20)}
        hrefFor={(n) =>
          `/talk?${new URLSearchParams({ q: query, category, purpose, page: String(n) })}`
        }
      />
    </div>
  );
}
