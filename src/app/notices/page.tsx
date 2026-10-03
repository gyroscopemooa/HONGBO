import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { store } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "공지사항",
  alternates: { canonical: "/notices" },
};

export default async function NoticesPage() {
  const notices = await store.listNotices();
  return (
    <LegalPage title="공지사항">
      {notices.length === 0 ? (
        <p>등록된 공지사항이 없어요.</p>
      ) : (
        <ul className="!ml-0 !list-none divide-y divide-line">
          {notices.map((n) => (
            <li key={n.id} id={`n-${n.id}`} className="scroll-mt-28 py-5 first:pt-0 last:pb-0 target:rounded-xl target:bg-brand-soft/50 target:px-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="!mt-0 !mb-1">{n.title}</h2>
                <time dateTime={n.publishedAt} className="shrink-0 text-xs text-faint">
                  {formatDate(n.publishedAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </LegalPage>
  );
}
