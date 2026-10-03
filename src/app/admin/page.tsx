import Link from "next/link";
import { adminBulkSeed } from "./actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { store } from "@/lib/store";

export default async function AdminHome() {
  const s = await store.stats();
  const cards: Array<[string, number, string]> = [
    ["전체 홍보글", s.posts, "/admin/posts"],
    ["공개 중", s.active, "/admin/posts?status=active"],
    ["숨김/차단", s.hidden, "/admin/posts?status=hidden"],
    ["운영자 초기 글", s.seed, "/admin/posts?seed=1"],
    ["처리 대기 신고", s.openReports, "/admin/reports"],
    ["가입 사용자", s.users, "/admin/users"],
  ];
  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, n, href]) => (
          <li key={label}>
            <Link href={href} className="block rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-hover">
              <p className="text-[13px] font-medium text-muted">{label}</p>
              <p className="mt-1 text-[28px] font-black tabular-nums tracking-[-0.03em]">{n.toLocaleString()}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card" aria-label="초기 콘텐츠 관리">
        <h2 className="text-lg font-extrabold tracking-[-0.03em]">운영자 초기 콘텐츠(seed) 관리</h2>
        <p className="mt-1 text-[14px] leading-relaxed text-muted">
          처음 화면이 비어 보이지 않도록 넣어둔 운영자 글 {s.seed}개가 있어요. 실제 이용자 글이 충분히 쌓이면 숨기거나 삭제하세요.
          숨김은 언제든 다시 공개로 되돌릴 수 있고, 삭제는 되돌릴 수 없어요.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={adminBulkSeed}>
            <input type="hidden" name="action" value="hide" />
            <ConfirmButton message="운영자 초기 글을 모두 숨길까요? (되돌릴 수 있어요)" className="!border-line !text-ink-2 hover:!bg-soft">
              초기 글 모두 숨기기
            </ConfirmButton>
          </form>
          <form action={adminBulkSeed}>
            <input type="hidden" name="action" value="show" />
            <button type="submit" className="btn btn-outline btn-sm">
              숨긴 초기 글 다시 공개
            </button>
          </form>
          <form action={adminBulkSeed}>
            <input type="hidden" name="action" value="delete" />
            <ConfirmButton message="운영자 초기 글을 모두 영구 삭제할까요? 되돌릴 수 없어요.">초기 글 모두 삭제</ConfirmButton>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card" aria-label="안내">
        <h2 className="text-lg font-extrabold tracking-[-0.03em]">운영 메모</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-muted">
          <li>
            <b className="text-ink-2">메인 고정</b>: 홍보글 목록에서 &lsquo;메인 고정&rsquo;과 순위를 지정하면 &ldquo;오늘의 인기 홍보&rdquo;에 먼저 노출돼요. 실제 조회·클릭이 충분히 쌓이면 자동 인기순으로 바뀌어요.
          </li>
          <li>신고는 자동으로 글을 숨기지 않아요. 신고 탭에서 내용을 확인한 뒤 숨김·반려를 선택하세요.</li>
          <li>사용자를 차단하면 새 글 작성·이미지 업로드가 막혀요. (기존 글은 그대로 유지돼요.)</li>
        </ul>
      </section>
    </div>
  );
}
