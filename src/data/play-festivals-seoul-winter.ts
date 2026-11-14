import type { PlayPlace } from "@/lib/play";

// 서울 연말 행사. 서울시 문화행사 안내(festival.seoul.go.kr) 기준, 2026-11-15 확인.
// 시간·요금이 안내에 없는 항목은 확인되지 않았다고 표시한다. 공식 사진 이용 허락을 확인하지 못해 일러스트로 대체한다.
const base = { kind: "축제·행사", region: "서울", companions: ["데이트", "가족과", "친구와", "혼자"], mood: "서울의 연말", art: "fireworks", checkedAt: "2026-11-15", source: "https://festival.seoul.go.kr/festival/main/festivalView.do?festacode=415", sourceLabel: "서울시 문화행사 공식 안내" } as const;
export const PLAY_SEOUL_WINTER_FESTIVALS: PlayPlace[] = [
  {
    ...base, slug: "korea-christmas-tree-2026", title: "2026 대한민국 성탄축제 성탄트리 점등식", area: "서울광장",
    companions: [...base.companions], summary: "서울광장에서 성탄트리에 불을 밝히는 점등식. 연말 분위기를 가장 먼저 느끼고 싶은 날 저녁에 들러보세요.",
    price: "요금은 공식 안내 확인", address: "서울 중구 세종대로 110 서울광장", startDate: "2026-11-16", endDate: "2026-11-16",
    tips: ["서울시 안내 기준 점등식은 11월 16일 18시입니다. 이후 트리 전시 기간은 확인하지 못했으니 방문 전 공지를 확인하세요.", "저녁 야외 행사이므로 방한 겉옷을 챙기고 시청역 일대 혼잡과 교통 통제를 고려하세요."],
    guide: "서울광장에서 열리는 성탄트리 점등식입니다. 주최는 CTS기독교TV, 서울시 등이 후원·협력하는 것으로 안내되어 있습니다. 입장 요금과 프로그램 구성은 안내에 없어 확인하지 못했으므로 방문 전 주최 공지를 확인하세요.",
    conditions: { kind: "축제·행사", subtype: "공연·문화행사", notice: "festival", cost: "unknown", costDetails: "요금은 공식 안내 확인", visit: "unknown", solo: "unknown", eligibility: "", preparation: "방한 겉옷 권장", exceptions: "당일 진행 공지와 교통 통제 확인", benefitConditions: "" },
  },
  {
    ...base, slug: "romantic-hangang-christmas-2026", title: "2026 로맨틱한강 크리스마스 마켓", area: "뚝섬한강공원",
    companions: [...base.companions], summary: "한강공원에서 즐기는 크리스마스 마켓. 12월 24일부터 27일까지 나흘간 열리는 연말 데이트 후보입니다.",
    price: "요금은 공식 안내 확인", address: "서울 광진구 자양동 뚝섬한강공원", startDate: "2026-12-24", endDate: "2026-12-27",
    tips: ["서울시 안내에서 확인된 것은 기간과 장소입니다. 운영 시간과 요금은 확인하지 못했으니 방문 전 공지를 확인하세요.", "강변 야외 행사라 바람이 찹니다. 방한 용품을 준비하고 지하철 7호선 자양역 등 귀가 교통편을 미리 확인하세요."],
    guide: "뚝섬한강공원에서 열리는 크리스마스 마켓입니다. 기간은 12월 24일(목)부터 27일(일)까지로 서울시 안내에 나와 있으며, 판매 품목과 운영 시간은 공개된 정보에서 확인하지 못했습니다.",
    conditions: { kind: "축제·행사", subtype: "공연·문화행사", notice: "festival", cost: "unknown", costDetails: "요금은 공식 안내 확인", visit: "unknown", solo: "unknown", eligibility: "", preparation: "방한 겉옷 권장", exceptions: "운영 시간·요금 미확인, 기상 상황에 따른 변경 가능", benefitConditions: "" },
  },
];
