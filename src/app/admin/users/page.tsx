import { adminSetUserStatus } from "../actions";
import { Pagination } from "@/components/Pagination";
import { getCurrentUser } from "@/lib/auth";
import { buildHref } from "@/lib/listing";
import { store } from "@/lib/store";
import { cleanQuery, formatDate, parsePositiveInt } from "@/lib/utils";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminUsers({ searchParams }: Props) {
  const sp = await searchParams;
  const q = cleanQuery(sp.q);
  const page = parsePositiveInt(sp.page, 1);
  const pageSize = 30;
  const [{ items, total }, me] = await Promise.all([store.listProfiles({ q, page, pageSize }), getCurrentUser()]);

  return (
    <div>
      <form action="/admin/users" className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="닉네임 또는 이메일" className="field max-w-[320px] !py-2" aria-label="사용자 검색" />
        <button className="btn btn-primary">검색</button>
      </form>
      <p className="mb-3 text-sm text-muted">
        총 <b className="text-ink">{total.toLocaleString()}</b>명
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        {items.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-bold">
                {u.nickname}
                {u.status === "blocked" && <span className="ml-2 rounded-md bg-[#ffe9e8] px-1.5 py-0.5 text-[11.5px] font-bold text-[#c93a35]">작성 제한</span>}
              </p>
              <p className="truncate text-xs text-faint">
                {u.email ?? "이메일 없음"} · 가입 {formatDate(u.createdAt)} · {u.id.slice(0, 8)}
              </p>
            </div>
            {u.id !== me?.id && (
              <form action={adminSetUserStatus}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="status" value={u.status === "blocked" ? "active" : "blocked"} />
                <button className={u.status === "blocked" ? "btn btn-outline btn-sm" : "btn btn-danger btn-sm"}>
                  {u.status === "blocked" ? "제한 해제" : "작성 제한"}
                </button>
              </form>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="py-12 text-center text-muted">사용자가 없어요.</li>}
      </ul>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} hrefFor={(p) => buildHref("/admin/users", { q, page: p > 1 ? p : undefined })} />
    </div>
  );
}
