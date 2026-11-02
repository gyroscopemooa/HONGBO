import type { Metadata } from "next";
import { NoticeAccordion } from "@/components/NoticeAccordion";
import { LegalPage } from "@/components/LegalPage";
import { store } from "@/lib/store";

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
        <NoticeAccordion notices={notices} />
      )}
    </LegalPage>
  );
}
