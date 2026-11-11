import { PlayBannerCarousel, type PlayBannerSlide } from "./PlayBannerCarousel";

const SLIDES: PlayBannerSlide[] = [
  { href: "#new-festivals", kicker: "NEW / 최근 축제", title: ["지금 막 올라온,", "이번 달 새 축제 보기"], note: "공식 안내로 일정을 확인한 최신 축제만 모았어요", cta: "최근 축제 보기", image: "/play/gunsan-fireworks-2026.jpg", alt: "군산 내항 밤하늘의 불꽃" },
  { href: "/play/region/gyeongbuk", kicker: "GYEONGSANG / 경상도 여행", title: ["경주 야경부터 포항 바다까지,", "경상도 축제·여행 보기"], note: "경북 · 경주·포항 가볼 만한 곳과 축제 모음", cta: "경상도 축제 보기", image: "/play/haeundae.jpg", alt: "해운대 바다와 해변" },
  { href: "#festivals", kicker: "CALENDAR / 월별 축제", title: ["이번 주말은 어디로?", "월별 축제 달력으로 골라요"], note: "종료된 행사는 지난 축제 기록으로 따로 정리해요", cta: "축제 달력 보기", image: "/play/busan-fireworks.jpg", alt: "광안대교 위로 펼쳐지는 불꽃" },
  { href: "/play/dates", kicker: "DATE / 커플 추천", title: ["둘이 걷기 좋은 하루,", "커플 데이트 명소 8곳"], note: "산책 · 야경 · 체험으로 나눠 코스까지 제안해요", cta: "데이트 추천 보기", image: "/play/seoul-lantern.jpg", alt: "청계천의 푸른 빛 조형물" },
  { href: "#explore", kicker: "FIND / 조건으로 찾기", title: ["지역·종류·이용 조건,", "원하는 것만 골라서 찾기"], note: "서울 근교 · 체험 · 테마파크까지 한 번에", cta: "갈 만한 곳 찾기", image: "/play/lotte-world.jpg", alt: "서울 롯데월드 매직캐슬" },
  { href: "/play/blueline-park", kicker: "BUSAN / 체험 나들이", title: ["우리의 다음 정거장은", "바다 옆 스카이캡슐"], note: "해변열차와 스카이캡슐은 서로 다른 상품이에요", cta: "이용·예약 안내", image: "/play/sky-capsule.jpg", alt: "해운대 고가 선로 위의 스카이캡슐" },
];
export function PlayBanner() { return <PlayBannerCarousel slides={SLIDES}/>; }
