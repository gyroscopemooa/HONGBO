import Link from "next/link";
import { PLAY_THEMES } from "@/data/play-themes";

const FAQ: [string, string][] = [
  ["서울 근처에서 갈 만한 곳은 어떻게 찾나요?", "위쪽 지역·종류·이용 조건 검색에서 지역을 서울·경기로 고르면 공원·박물관·테마파크·축제를 한 번에 볼 수 있어요. 가족 나들이와 커플 데이트 추천 섹션에서도 서울 근교 장소를 먼저 확인할 수 있습니다."],
  ["날씨는 며칠 뒤까지 볼 수 있나요?", "각 장소 상세 페이지에서 오늘 날씨를 바로 확인하고, 날짜를 고르면 오늘부터 약 16일 이내는 시간대별 예보를 보여줍니다. 그 이후 날짜는 최근 5년 같은 날짜의 평균을 참고용으로만 안내하며 실제 예보가 아닙니다."],
  ["해돋이 시각은 어디서 확인하나요?", "일출 시각은 날짜와 장소마다 달라서 이 페이지에 고정 시각을 적지 않았습니다. 한국천문연구원 등 공식 계산 자료로 방문일 시각을 확인하고 최소 30분 이상 일찍 도착하세요."],
  ["일정 확인 중으로 표시된 축제는 가도 되나요?", "개최가 공식 확정되기 전의 참고 일정입니다. 주최 측 공지로 날짜와 장소, 요금을 확인한 뒤에 이동 계획을 세우세요."],
  ["가격과 운영시간은 정확한가요?", "확인한 범위만 적고, 확정하지 못한 요금·운영시간은 공식 안내 확인으로 표시했습니다. 요금과 휴무는 바뀔 수 있어 방문 전 출처 링크에서 다시 확인해 주세요."],
];

export function PlaySeoFooter() {
  return (
    <section className="play-section" id="about-play" aria-label="놀러가자 안내">
      <h2>국내 가볼 만한 곳, 테마로 골라보세요</h2>
      <p className="play-muted mt-3">
        놀러가자는 커플 데이트, 가족 나들이, 국내 자연 명소, 등산, 바다, 강 산책, 해돋이, 낚시, 숨은 명소까지 테마별로 국내 여행지를 정리한 안내입니다.
        각 장소마다 위치 지도와 날짜별 날씨, 근처 맛집·카페 검색, 주차와 방문 전 확인사항, 공식 출처를 함께 제공합니다.
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
        {PLAY_THEMES.map(t => <li key={t.id}><a href={`#${t.id}`} className="underline">{t.title}</a></li>)}
        <li><Link href="/play/dates" className="underline">커플 데이트 명소 8곳</Link></li>
        <li><a href="#festivals" className="underline">월별 축제 달력</a></li>
        <li><a href="#jan-2027" className="underline">2027년 1월 축제</a></li>
      </ul>
      <h3 className="mt-8 text-lg font-bold">자주 묻는 질문</h3>
      <div className="mt-3 space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="rounded-xl border border-[#d8e4f5] bg-white p-4">
            <summary className="cursor-pointer font-bold">{q}</summary>
            <p className="play-muted mt-2">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function playFaqSchema() {
  return {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}
