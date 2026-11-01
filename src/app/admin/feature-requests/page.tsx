import { listFeatureRequests, type FeatureRequest } from "@/lib/feature-requests";
import { formatDate, relativeTime } from "@/lib/utils";

export default async function AdminFeatureRequests() {
  let items: FeatureRequest[] = [];
  try {
    items = await listFeatureRequests();
  } catch (error) {
    console.error("feature requests list failed", error);
    return (
      <p className="rounded-xl bg-soft p-4 text-sm text-ink-2">
        목록을 불러오지 못했어요. supabase/migrations/0003_feature_requests.sql 을 적용했는지 확인해주세요.
      </p>
    );
  }
  if (items.length === 0) return <p className="rounded-xl bg-soft p-4 text-sm text-ink-2">아직 접수된 기능 요청이 없어요.</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((r) => (
        <li key={r.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="whitespace-pre-wrap text-[14.5px] text-ink">{r.message}</p>
          <p className="mt-2 text-xs text-faint">
            {formatDate(r.createdAt)} · {relativeTime(r.createdAt)}
            {r.page ? ` · ${r.page}` : ""}
            {r.contact ? ` · 연락처: ${r.contact}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
