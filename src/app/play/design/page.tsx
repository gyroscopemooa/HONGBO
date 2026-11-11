import type { Metadata } from "next";
import Link from "next/link";
import { PlayArt } from "@/components/PlayArt";

export const metadata: Metadata = {
  title: "블루·화이트 디자인 샘플 | 놀러가자",
  robots: { index: false, follow: false },
};

export default function PlayDesignSample() {
  return <section className="pb-10">
    <p className="play-eyebrow">DESIGN SAMPLE</p>
    <h1 className="mt-3 text-3xl font-black">같은 여행, 두 가지 블루.</h1>
    <p className="play-muted mt-3">A는 여행 분위기가 선명한 블루 중심, B는 사진과 정보를 돋보이게 하는 화이트 중심입니다.</p>
    <div className="mt-8 grid gap-7 lg:grid-cols-2">
      {(["blue", "white"] as const).map((theme, index) => <article key={theme} className="overflow-hidden rounded-3xl border border-[#d9e6f8] bg-white">
        <div className={`p-7 ${theme === "blue" ? "bg-[#1762e8] text-white" : "bg-white text-[#142b50]"}`}>
          <p className="text-xs font-bold tracking-widest">{index === 0 ? "A / BLUE FIRST" : "B / WHITE FIRST"}</p>
          <h2 className="mt-5 text-3xl font-black leading-tight">이번 주말,<br/>바다 보러 갈래요?</h2>
          <p className={`mt-4 text-sm ${theme === "blue" ? "text-blue-100" : "text-slate-500"}`}>데이트부터 가족 나들이까지, 가까운 행복을 찾아요.</p>
          <Link href="/play" className={`mt-6 inline-block rounded-xl px-5 py-3 text-sm font-bold ${theme === "blue" ? "bg-white !text-[#1762e8]" : "bg-[#1762e8] !text-white"}`}>갈 만한 곳 둘러보기 ↗</Link>
        </div>
        <div className={`p-6 ${theme === "blue" ? "bg-[#eaf3ff]" : "bg-[#f8fafc]"}`}>
          <div className="play-card"><div className="play-card-art"><PlayArt art={index === 0 ? "sea" : "train"}/><span className="play-badge">부산 · 데이트</span></div><div className="play-card-body"><h3>{index === 0 ? "해운대, 바다를 따라 천천히" : "바다 옆으로 떠나는 작은 여행"}</h3><p>사진은 넓게, 설명은 여유롭게. 장소의 분위기와 방문할 이유를 함께 보여주는 카드입니다.</p><div className="play-card-bottom"><span>장소 안내 카드 샘플</span><span>자세히 보기 ↗</span></div></div></div>
        </div>
      </article>)}
    </div>
    <div className="play-note mt-8"><strong>카드 크기 제안</strong><p className="mt-2">기본 장소 카드는 데스크톱 3열, 약 368px 폭의 큰 카드로 구성했습니다. 사진 영역은 가로 3:2, 모바일은 1열·가로 8:5입니다. 카드 전체는 사진과 설명을 합친 세로 직사각형으로 유지합니다. 축제 공지나 짧은 할인 소식은 정보량에 맞춰 더 작은 목록형으로 확장할 수 있습니다.</p></div>
    <Link href="/play" className="play-button mt-6">적용된 놀러가자 보기 →</Link>
  </section>;
}
