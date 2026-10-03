import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { contactEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "문의하기",
  description: "더홍보 이용 문의, 신고, 광고 문의 안내",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const email = contactEmail();
  return (
    <LegalPage title="문의하기">
      <h2>일반 문의 · 계정 문의</h2>
      {email ? (
        <p>
          서비스 이용, 계정, 개인정보 관련 문의는 <a href={`mailto:${email}`}>{email}</a> 로 보내주세요.
        </p>
      ) : (
        <p>문의 채널을 준비하고 있어요. 급한 사항은 아래 신고 방법을 이용해주세요.</p>
      )}

      <h2>신고 · 권리침해 신고</h2>
      <p>
        불법·사기·도배 등 운영정책에 어긋나는 홍보글은 해당 홍보글 상세 페이지의 <b>신고하기</b>로 알려주세요. 로그인 없이도 신고할 수 있고, 운영자가 확인 후 조치합니다.
        저작권 등 권리침해 신고는 신고 사유에서 &lsquo;권리 침해&rsquo;를 선택하고 자세한 내용을 적어주세요. 자세한 기준은 <Link href="/policy">운영정책</Link>에서 확인할 수 있어요.
      </p>

      <h2 id="ads">광고 문의</h2>
      <p>
        현재 더홍보의 홍보글 등록은 모두 무료이며, 유료 광고 상품은 준비 중입니다. 제휴·광고 제안은 {email ? <a href={`mailto:${email}`}>{email}</a> : "문의 채널이 열리면 이곳에 안내해 드릴게요"}
        {email ? " 로 보내주세요." : "."}
      </p>
    </LegalPage>
  );
}
