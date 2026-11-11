import type { Metadata } from "next";
import Link from "next/link";
import { PlayArt } from "@/components/PlayArt";
import { PlayExplorer } from "@/components/PlayExplorer";
import { PostCard } from "@/components/PostCard";
import { PLAY_PLACES } from "@/data/play";
import { PLAY_TAG, koreanDay } from "@/lib/play";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "놀러가자 — 국내 데이트·가족 나들이·축제·혜택",
  description: "일상 가까운 작은 여행. 국내 명소, 테마파크, 축제, 숙소와 이용 혜택을 찾아보고 좋은 장소를 공유하세요.",
  alternates: { canonical: "/play" },
  openGraph: { title: "놀러가자 | 더홍보", description: "이번 주말, 좋은 시간을 발견하세요.", url: "/play" },
};

export default async function PlayPage() {
  const posts = await store.listPosts({ publicOnly: true, isSeed: false, tag: PLAY_TAG, pageSize: 6, sort: "latest" }).catch(()=>null);
  return <>
    <section className="play-hero"><div className="play-hero-copy"><span className="play-eyebrow">GOOD DAYS, CLOSE TO YOU</span><h1>잘 쉬고, 잘 놀고.<br/>우리, 놀러가자<span className="text-[#1762e8]">.</span></h1><p>둘이 떠나는 데이트부터 온 가족의 주말까지.<br/>멀리 가지 않아도, 좋은 하루는 시작되니까.</p><div className="play-hero-links"><a href="#explore" className="play-button">갈 만한 곳 찾아보기 ↗</a><a href="#shared" className="play-button secondary">함께 나누는 소식</a></div></div><PlayArt art="sea" className="play-hero-art"/></section>
    <div className="flex flex-wrap gap-x-7 gap-y-2 border-b border-[#d9e6f8] py-5 text-xs font-semibold text-[#59769a]"><span>✳ 국내부터 차근차근</span><span>↗ 공식 안내로 한 번 더 확인</span><span>♡ 작은 가게부터 큰 여행지까지</span></div>
    <PlayExplorer places={PLAY_PLACES} day={koreanDay()}/>
    <section id="shared" className="play-section"><div className="play-heading"><div><p className="play-eyebrow">SHARED BY OUR COMMUNITY</p><h2 className="mt-2">함께 나누는 장소와 소식</h2></div><Link href="/play/shared" className="text-sm font-bold">모두 보기 →</Link></div><p className="play-muted mb-5">이용자·업체가 직접 올리는 공개 홍보입니다. 행사 기간과 혜택 조건은 각 글에서 확인하세요.</p>
      {posts?.items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.items.map(p=><PostCard key={p.id} post={p}/>)}</div> : <div className="play-empty"><h3 className="text-xl font-bold">{posts ? "좋은 곳을 아는 당신의 첫 소식을 기다려요" : "공유 소식을 불러오지 못했어요"}</h3><p className="play-muted mt-3">{posts ? "동네 사진관, 공방, 펜션, 축제 소식까지. 나들이가 되는 곳이라면 알려주세요." : "잠시 후 다시 방문해주세요. 위의 장소 안내는 계속 볼 수 있어요."}</p><Link href="/play/share" className="play-button mt-5">장소·소식 공유하기</Link></div>}
    </section>
    <section className="play-invite"><div><p className="play-eyebrow mb-2">FOR EVERY GOOD PLACE</p><h2>작은 가게에도, 놀러 갈 이유는 있으니까.</h2><p className="play-muted">사진 한 장의 추억, 새로운 체험, 하루의 쉼.<br/>사장님도 여행자도 더홍보 계정으로 무료로 공유하세요.</p></div><Link href="/play/share" className="play-button shrink-0">우리 동네 좋은 곳 알리기 ↗</Link></section>
    <p className="play-muted mt-6 !text-xs">공식 자료를 참고한 편집 안내와 회원 홍보를 구분해 제공합니다. 예약·결제는 각 업체에서 진행하며, 요금·영업일·혜택은 방문 전 공식 안내를 확인하세요.</p>
  </>;
}
