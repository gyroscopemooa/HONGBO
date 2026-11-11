import Link from "next/link";
import "./play.css";
import { PLAY_PHOTOS } from "@/data/play-photos";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <div className="play-page"><div className="play-wrap">
    <header className="play-masthead"><Link href="/play" className="play-wordmark">놀러가자<span>.</span> <small className="text-[11px] font-semibold tracking-normal text-[#7386a0]">by 더홍보</small></Link><Link href="/play/share" className="play-button secondary">장소·소식 공유하기 ↗</Link></header>
    {children}
    <footer className="play-photo-credits"><strong>사진 출처</strong>{Object.values(PLAY_PHOTOS).map(photo => <p key={photo.src}><a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.title}</a> · {photo.author} · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a></p>)}<p>자료사진을 사용하며 화면 비율에 맞춰 크기·표시 영역을 조정했습니다. 사진·배너의 사진 사용분에도 동일 라이선스를 적용합니다.</p></footer>
  </div></div>;
}
