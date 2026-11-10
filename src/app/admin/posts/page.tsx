import Link from "next/link";
import { Eye, EyeOff, Pencil, Pin, ShieldBan } from "lucide-react";
import { adminDeletePost, adminPinPost, adminSetOfficial, adminSetPostStatus } from "../actions";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Pagination } from "@/components/Pagination";
import { PostImage } from "@/components/PostImage";
import { StatusBadge } from "@/components/StatusBadge";
import { CATEGORIES, isCategorySlug } from "@/lib/constants";
import { buildHref } from "@/lib/listing";
import { effectiveStatus } from "@/lib/queries";
import { store } from "@/lib/store";
import { cleanQuery, formatDate, parsePositiveInt, pickFirst } from "@/lib/utils";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const STATUSES = [
  ["", "전체 상태"],
  ["active", "게시중"],
  ["hidden", "숨김"],
  ["blocked", "차단"],
  ["expired", "만료"],
  ["deleted", "삭제(작성자)"],
] as const;

export default async function AdminPosts({ searchParams }: Props) {
  const sp = await searchParams;
  const q = cleanQuery(sp.q);
  const catRaw = pickFirst(sp.category);
  const category = isCategorySlug(catRaw) ? catRaw : undefined;
  const statusRaw = pickFirst(sp.status) ?? "";
  const status = STATUSES.some(([v]) => v === statusRaw && v) ? (statusRaw as "active" | "hidden" | "blocked" | "expired" | "deleted") : undefined;
  const seedRaw = pickFirst(sp.seed);
  const isSeed = seedRaw === "1" ? true : seedRaw === "0" ? false : undefined;
  const pinnedOnly = pickFirst(sp.pinned) === "1";
  const page = parsePositiveInt(sp.page, 1);
  const pageSize = 30;

  const { items, total } = await store.listPosts({ q, category, status, isSeed, pinnedOnly, page, pageSize, sort: "latest" });
  const href = (p: number) =>
    buildHref("/admin/posts", { q, category, status, seed: seedRaw, pinned: pinnedOnly ? "1" : undefined, page: p > 1 ? p : undefined });

  return (
    <div>
      <form action="/admin/posts" className="mb-4 grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap rounded-2xl border border-line bg-white p-3 shadow-card">
        <label className="col-span-2 min-w-0 sm:min-w-[180px] sm:flex-1 text-xs font-semibold text-muted">
          검색
          <input name="q" defaultValue={q} placeholder="제목·소개·설명·태그" className="field mt-1 !py-2" />
        </label>
        <label className="min-w-0 text-xs font-semibold text-muted">
          카테고리
          <select name="category" defaultValue={category ?? ""} className="field mt-1 !py-2">
            <option value="">전체</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-xs font-semibold text-muted">
          상태
          <select name="status" defaultValue={status ?? ""} className="field mt-1 !py-2">
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-xs font-semibold text-muted">
          구분
          <select name="seed" defaultValue={seedRaw ?? ""} className="field mt-1 !py-2">
            <option value="">전체</option>
            <option value="1">운영자 초기 글</option>
            <option value="0">이용자 글</option>
          </select>
        </label>
        <label className="flex h-[42px] items-center gap-1.5 text-sm font-medium text-ink-2">
          <input type="checkbox" name="pinned" value="1" defaultChecked={pinnedOnly} className="accent-[#f04f4a]" /> 메인 고정만
        </label>
        <button className="btn btn-primary">검색</button>
        <Link href="/admin/posts" className="btn btn-ghost">
          초기화
        </Link>
      </form>

      <p className="mb-3 text-sm text-muted">
        총 <b className="text-ink">{total.toLocaleString()}</b>개
      </p>

      <ul className="space-y-2.5">
        {items.map((p) => {
          const st = effectiveStatus(p);
          const canHide = p.status === "active";
          const canBlock = p.status !== "blocked" && p.status !== "deleted" && !p.isSeed;
          return (
            <li key={p.id} className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-line bg-white p-3 shadow-card sm:grid-cols-[96px_minmax(0,1fr)] xl:grid-cols-[96px_minmax(0,1fr)_auto]">
              <Link href={`/post/${p.id}`} className="block w-full overflow-hidden rounded-lg">
                <PostImage src={p.primaryImageUrl} alt="" category={p.category} sizes="(min-width: 640px) 96px, 64px" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={st} />
                  <CategoryBadge slug={p.category} />
                  {p.isSeed && <span className="rounded-md bg-[#eef0f4] px-1.5 py-0.5 text-[11.5px] font-bold text-muted">초기 글</span>}
                  {p.adminPinned && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-brand-soft px-1.5 py-0.5 text-[11.5px] font-bold text-brand-dark">
                      <Pin size={11} aria-hidden /> 메인 고정{p.curatedRank ? ` #${p.curatedRank}` : ""}
                    </span>
                  )}
                  <span className="whitespace-nowrap text-xs text-faint">#{p.id}</span>
                </div>
                <Link href={`/post/${p.id}`} className="mt-1 line-clamp-2 text-sm font-bold hover:text-brand-dark sm:text-base" title={p.title}>
                  {p.title}
                </Link>
                <p className="mt-0.5 text-xs leading-relaxed text-faint">
                  {formatDate(p.publishedAt)} · 조회 {p.viewCount} · 클릭 {p.clickCount}
                  {p.authorId ? ` · 작성자 ${p.authorId.slice(0, 8)}` : " · 운영자"}
                </p>
              </div>
              <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-2 xl:col-span-1 xl:self-center">
                <form action={adminSetOfficial} className="flex min-w-0 basis-full items-center gap-1.5 rounded-lg bg-soft p-1.5 sm:basis-auto">
                  <input type="hidden" name="id" value={p.id} />
                  <select name="official" defaultValue={p.extra.official ?? ""} aria-label="더홍보 표시" className="h-8 min-w-0 flex-1 rounded-md border border-line bg-white px-2 text-xs sm:text-sm">
                    <option value="">표시 없음</option>
                    <option value="official">더홍보 공식</option>
                    <option value="verified">더홍보 인증</option>
                  </select>
                  <button className="btn btn-outline btn-sm !px-2.5">저장</button>
                </form>
                <form action={adminPinPost} className="flex min-w-0 basis-full items-center gap-1.5 rounded-lg bg-soft p-1.5 sm:basis-auto">
                  <input type="hidden" name="id" value={p.id} />
                  <label className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-semibold text-ink-2">
                    <input type="checkbox" name="pinned" defaultChecked={p.adminPinned} className="accent-[#f04f4a]" /> 메인 고정
                  </label>
                  <input
                    type="number"
                    name="rank"
                    min={1}
                    defaultValue={p.curatedRank ?? ""}
                    placeholder="순위"
                    aria-label="큐레이션 순위"
                    className="h-8 w-12 min-w-0 flex-1 rounded-md border border-line bg-white px-1.5 text-xs sm:flex-none"
                  />
                  <button className="btn btn-outline btn-sm !px-2.5">저장</button>
                </form>
              </div>
              <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-2 border-t border-line pt-2.5 xl:col-span-3 [&_.btn]:min-h-9 [&_.btn]:px-2! sm:[&_.btn]:px-2.5!">
                <form action={adminSetPostStatus} className="contents">
                  <input type="hidden" name="id" value={p.id} />
                  {(canHide || canBlock) && (
                    <label className="flex min-w-0 basis-full items-center gap-2 rounded-lg border border-line bg-soft/50 px-2.5 sm:basis-auto sm:flex-1">
                      <span className="shrink-0 text-xs font-semibold text-muted">조치 사유</span>
                      <input name="reason" aria-label="작성자에게 표시할 숨김·차단 사유" className="h-9 w-full min-w-0 bg-transparent text-[13px] outline-none" required maxLength={2000} defaultValue="내부 운영정책에 의한 숨김 및 차단" />
                    </label>
                  )}
                  {canHide ? (
                    <button name="status" value="hidden" className="btn btn-outline btn-sm">
                      <EyeOff size={14} aria-hidden /> 숨김
                    </button>
                  ) : p.status !== "deleted" && (
                    <button name="status" value="active" formNoValidate className="btn btn-outline btn-sm">
                      <Eye size={14} aria-hidden /> 복구
                    </button>
                  )}
                  {canBlock && (
                    <button name="status" value="blocked" className="btn btn-outline btn-sm" title="작성자가 다시 공개할 수 없는 차단 상태로 바꿉니다">
                      <ShieldBan size={14} aria-hidden /> 차단
                    </button>
                  )}
                </form>
                <Link href={`/post/${p.id}/edit`} className="btn btn-outline btn-sm">
                  <Pencil size={14} aria-hidden /> 수정
                </Link>
                <form action={adminDeletePost}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton message={`'${p.title}' 글을 영구 삭제할까요? 되돌릴 수 없어요.`}>삭제</ConfirmButton>
                </form>
              </div>
            </li>
          );
        })}
        {items.length === 0 && <li className="rounded-2xl border border-dashed border-line bg-soft/60 py-12 text-center text-muted">조건에 맞는 글이 없어요.</li>}
      </ul>

      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} hrefFor={href} />
    </div>
  );
}
