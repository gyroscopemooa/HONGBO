import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PlayShareForm } from "@/components/PlayShareForm";

export const metadata: Metadata = { title: "장소·소식 공유하기 | 놀러가자", robots: { index: false, follow: false } };
export default async function PlaySharePage() {
  const user = await requireUser("/play/share");
  return <div className="play-form"><Link href="/play" className="play-muted">← 놀러가자로 돌아가기</Link><h1 className="mb-3 mt-5 text-3xl font-black">좋은 곳, 함께 놀러가요.</h1><p className="play-muted mb-8">동네 사진관부터 공방, 펜션, 축제와 할인 소식까지.<br/>누군가의 좋은 하루가 될 정보를 나눠주세요.</p>{user.status==="blocked" ? <p role="alert" className="play-note">작성이 제한된 계정입니다. 문의하기로 연락해주세요.</p> : <PlayShareForm/>}</div>;
}
