import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { contactEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "홍보글 복원 신청",
  description: "숨김·차단된 홍보글 및 이용 제한에 대한 복원 신청 안내와 신청서 다운로드",
  robots: { index: false, follow: false },
};

export default async function RestorationPage({ searchParams }: { searchParams: Promise<{ post?: string }> }) {
  const params = await searchParams;
  const postId = typeof params.post === "string" && /^[1-9]\d{0,14}$/.test(params.post) ? params.post : null;
  const email = contactEmail() || "support@thehongbo.com";
  const subject = `[복원 신청] ${postId ? `게시글 ${postId}` : "게시글 번호 또는 계정"} / 서비스명`;
  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("작성한 복원 신청서(.docx)와 확인 자료를 직접 첨부해주세요.\n\n게시글 번호: " + (postId || "") + "\n서비스명: \n보완한 공개 주소: \n")}`;
  return <LegalPage title="홍보글 복원 신청">
    <p>숨김·차단된 홍보글이나 계정 이용 제한에 대한 재검토를 요청할 수 있습니다. 신청서를 내려받아 제한 사유별 보완 내용과 확인 자료를 작성한 뒤 더홍보 지원 메일로 보내주세요.</p>
    {postId && <p><b>신청 대상 게시글 번호: {postId}</b> — 신청서에도 같은 번호를 기재해주세요.</p>}
    <p><a href="/downloads/hongbo-restoration-form.docx" download className="btn btn-primary">복원 신청서 다운로드 · Word (.docx)</a></p>
    <p>Word에서 작성할 수 있는 양식입니다. 각 항목의 안내문을 읽고 입력란을 늘려 작성해주세요. 신청서 다운로드나 메일 작성 버튼만으로 접수되지는 않습니다.</p>
    <h2>1. 작성 및 제출 순서</h2>
    <ol>
      <li><Link href="/policy">운영정책</Link>과 안내받은 제한 사유를 확인합니다. 사유를 안내받지 못했다면 먼저 지원 메일로 문의해주세요.</li>
      <li>서비스 소개·제공 기능·혜택 조건·운영 정보·문의 방법 등을 보완합니다. 글 수정이 제한되어 있으면 수정할 원고를 신청서에 작성합니다.</li>
      <li>신청서의 기본 정보, 제한 사유, 서비스 설명, 보완 내역, 증빙 목록, 재발 방지 계획, 확인란을 모두 작성합니다.</li>
      <li>파일명을 ‘복원신청_게시글번호_서비스명.docx’로 저장하고, 아래 지원 메일에 직접 첨부하여 발송합니다.</li>
    </ol>
    <h2>2. 항목별 작성 분량</h2>
    <ul>
      <li>제한 사유 이해 및 소명: 300~1,000자</li>
      <li>서비스 목적·실제 기능·이용 과정: 500~1,500자</li>
      <li>가입·결제·혜택 조건 및 운영 정보: 300~1,000자</li>
      <li>제한 사유별 수정 전후와 보완 내용: 500~2,000자</li>
      <li>복원 후 게시할 홍보글 원고: 300~1,500자</li>
      <li>재발 방지 계획 및 복원 요청 이유: 300~1,000자</li>
    </ul>
    <p>공백 포함, 각 답변 본문 기준입니다. 제목·안내문·주소·증빙 목록은 글자 수에서 제외합니다. 해당하지 않는 세부 항목은 ‘해당 없음’과 이유를 기재하고, 각 서술 항목의 분량은 충족해주세요. 반복 문장으로 분량만 채우거나 확인되지 않은 사실을 작성하면 보완을 요청할 수 있습니다.</p>
    <h2>3. 작성한 신청서 보내기</h2>
    <p>받는 주소: <a href={`mailto:${email}`}><b>{email}</b></a><br />메일 제목: {subject}</p>
    <p><a href={mailto} className="btn btn-primary">지원 메일로 신청서 보내기</a></p>
    <p>버튼은 기기의 메일 앱을 엽니다. 작성한 신청서와 증빙은 자동으로 첨부되지 않으므로 직접 첨부해주세요. 메일 앱이 열리지 않으면 위 주소를 복사해 평소 사용하는 메일에서 발송해주세요.</p>
    <h2>4. 증빙 및 검토 안내</h2>
    <p>공개 서비스 주소, 기능·혜택 조건·문의 경로를 확인할 수 있는 화면과 수정 전후 자료를 제출해주세요. 주민등록번호, 신분증 사본, 비밀번호, 인증번호, API 키 등은 보내지 마세요. 타인의 개인정보는 가려주세요.</p>
    <p>운영자는 제출 내용과 실제 서비스의 일치 여부, 정책 위반 사유 해소 여부를 검토합니다. 추가 설명이나 보완 자료를 요청할 수 있으며, 신청만으로 복원이나 계정 제한 해제가 보장되지 않습니다. 검토 중 기존 제한은 유지됩니다. 복원 신청 자료는 검토와 회신을 위해 처리하며 자세한 사항은 <Link href="/privacy">개인정보처리방침</Link>을 확인해주세요.</p>
    <p><Link href="/mypage">내 홍보로 돌아가기</Link> · <Link href="/policy">운영정책 확인하기</Link></p>
  </LegalPage>;
}
