import Link from "next/link";

export default function PlayNotFound() {
  return <section className="play-empty my-8"><h1 className="text-2xl font-bold">장소 안내를 찾을 수 없어요</h1><p className="play-muted mt-3">주소를 확인하거나 다른 나들이 장소를 살펴보세요.</p><Link href="/play" className="play-button mt-5">놀러가자로 돌아가기</Link></section>;
}
