import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="wrap flex flex-col items-center py-20 text-center sm:py-28">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Compass size={30} aria-hidden />
      </span>
      <h1 className="mt-5 text-[26px] font-black tracking-[-0.045em]">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-[15px] text-muted">삭제되었거나 주소가 바뀌었을 수 있어요. 다른 홍보를 둘러보세요.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="btn btn-primary">
          홈으로
        </Link>
        <Link href="/posts?sort=latest" className="btn btn-outline">
          최신 홍보글 보기
        </Link>
      </div>
    </div>
  );
}
