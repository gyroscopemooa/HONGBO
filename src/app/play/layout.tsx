import Link from "next/link";
import "./play.css";
import { PLAY_PHOTOS } from "@/data/play-photos";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <div className="play-page"><div className="play-wrap">
    <header className="play-masthead"><Link href="/play" className="play-wordmark">놀러가자<span>.</span> <small className="text-[11px] font-semibold tracking-normal text-[#7386a0]">by 더홍보</small></Link><Link href="/play/share" className="play-button secondary">장소·소식 공유하기 ↗</Link></header>
    {children}
    <footer className="play-photo-credits"><strong>사진 출처</strong>{Array.from(new Map(Object.values(PLAY_PHOTOS).map(p => [p.src, p])).values()).map(photo => <p key={photo.src}><a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.title}</a> · {photo.author} · {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a> : "제공 참고사진 · 원출처 권리 유지"}</p>)}<p>자료사진을 사용하며 화면 비율에 맞춰 크기·표시 영역을 조정했습니다. 사진별 출처·이용 조건을 따릅니다.</p></footer>
  </div></div>;
}
