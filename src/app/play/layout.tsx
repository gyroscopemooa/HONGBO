import Link from "next/link";
import "./play.css";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <div className="play-page"><div className="play-wrap">
    <header className="play-masthead"><Link href="/play" className="play-wordmark">놀러가자<span>.</span> <small className="text-[11px] font-semibold tracking-normal text-[#7a897c]">by 더홍보</small></Link><Link href="/play/share" className="play-button secondary">장소·소식 공유하기 ↗</Link></header>
    {children}
  </div></div>;
}
