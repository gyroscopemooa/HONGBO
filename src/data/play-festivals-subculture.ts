import type { PlayPlace } from "@/lib/play";

// 코스프레·서브컬처 행사. 2026-11-11 확인. 사진은 공식 이용 허락을 확인하지 못해 일러스트 대체로 둡니다.
const base = { kind: "축제·행사", companions: ["친구와", "혼자", "단체"], mood: "서울 근교 · 서브컬처", art: "park", checkedAt: "2026-11-11" } as const;
export const PLAY_SUBCULTURE_FESTIVALS: PlayPlace[] = [
  {
    ...base, slug: "coscomic-96-2026", title: "제96회 코스앤코믹 페스티벌", region: "경기", area: "과천 서울랜드",
    companions: [...base.companions], summary: "서울랜드에서 열리는 코스프레·동인 행사. 서울 근교에서 코스프레를 구경하거나 참여하고 싶다면 확인해보세요.",
    price: "행사·놀이공원 이용권 별도 확인", address: "경기 과천시 광명로 181 서울랜드", startDate: "2026-11-28", endDate: "2026-11-29",
    tips: ["주최 안내에 행사 포스터 이미지를 매표소에서 보여주면 서울랜드 이용권 할인을 받을 수 있다고 소개되어 있습니다. 대상·조건은 현장 확인이 필요합니다.", "운영시간과 입장료, 코스프레 참가 규정은 확인하지 못했습니다. 주최 카페 공지를 확인하세요."],
    source: "https://cafe.naver.com/coscomic", sourceLabel: "코스앤코믹 공식 카페(일정은 코스프레 행사 정보 사이트 코슬리 기준)",
    guide: "서울랜드에서 열리는 코스프레·동인 행사입니다. 행사 일정은 주최 사정으로 바뀔 수 있으니 방문 전 공식 카페 공지에서 입장 방법과 코스프레 규정을 확인하세요.",
    conditions: { kind: "축제·행사", subtype: "공연·문화행사", notice: "festival", cost: "unknown", costDetails: "입장료·이용권 요금은 공식 공지 확인", visit: "ticket", solo: "yes", eligibility: "", preparation: "코스프레 참가 시 주최 규정 확인", exceptions: "일정·운영은 주최 사정에 따라 변경될 수 있음", benefitConditions: "포스터 이미지 제시 시 서울랜드 이용권 할인 안내(조건 확인)" },
  },
  {
    ...base, slug: "agf-korea-2026", title: "AGF 2026 (애니 X 게임 페스티벌)", region: "경기", area: "고양 킨텍스 제1전시장",
    companions: [...base.companions], summary: "애니메이션·게임·웹툰·버추얼 유튜버 등 서브컬처를 모은 대형 행사. 12월 4일부터 6일까지 킨텍스에서 열립니다.",
    price: "1일권 29,000원 · 3일권 65,000원(일반 판매 기준)", address: "경기 고양시 일산서구 킨텍스로 217-60 킨텍스 제1전시장 1~5홀", startDate: "2026-12-04", endDate: "2026-12-06",
    tips: ["공식 안내 운영시간은 매일 09:30~18:00이며 검표는 오전 8시부터 시작합니다.", "1일권은 날짜를 골라 구매하며 해당 날짜 팔찌로만 입장합니다. 3일권은 행사 기간 중 재입장이 가능합니다.", "공식 안내에 12세 이하가 관람하기 부적절한 콘텐츠나 상품이 있을 수 있다고 소개되어 있습니다."],
    source: "https://www.agfkorea.com/ticket", sourceLabel: "AGF 2026 공식 티켓 안내",
    guide: "애니메이션, 게임, 웹툰, 라이트 노벨, 버추얼 유튜버 등을 다루는 서브컬처 행사입니다. 일반 티켓은 2026년 11월 12일부터 12월 6일까지 판매로 안내되어 있으며, 현장 구매는 중단될 수 있어 사전 예매를 권장합니다.",
    conditions: { kind: "축제·행사", subtype: "전시·박람회", notice: "festival", cost: "paid", costDetails: "일반 1일권 29,000원 · 3일권 65,000원 · 패스트 티켓 50,000원(Melon Ticket 전용)", visit: "recommended", solo: "yes", eligibility: "최소 연령 제한은 없으나 12세 이하에게 부적절한 콘텐츠가 있을 수 있음", preparation: "예매 날짜의 입장 팔찌 확인", exceptions: "현장 구매는 상황에 따라 중단될 수 있음", benefitConditions: "", operatingHours: "09:30~18:00" },
  },
  {
    ...base, slug: "comicworld-winter-2026", title: "코믹월드 WINTER 2026", region: "경기", area: "고양 킨텍스 제1전시장",
    companions: [...base.companions], summary: "만화·애니메이션 동인 행사 코믹월드의 겨울 행사. 12월 12일부터 13일까지 킨텍스에서 열립니다.",
    price: "입장료는 공식 공지 확인", address: "경기 고양시 일산서구 킨텍스로 217-60 킨텍스 제1전시장", startDate: "2026-12-12", endDate: "2026-12-13",
    tips: ["입장료·운영시간·코스프레 규정을 확인하지 못했습니다. 코믹월드 공식 사이트 공지에서 확인하세요.", "코스프레 행사 정보 사이트 기준 일정이며 주최 사정으로 바뀔 수 있습니다."],
    source: "https://comicw.net/", sourceLabel: "코믹월드 공식 사이트(일정은 코스프레 행사 정보 사이트 코슬리 기준)",
    guide: "만화·애니메이션 동인 행사입니다. 일정은 외부 행사 정보 기준이므로 방문 전 코믹월드 공식 공지에서 입장 방법과 규정을 확인하세요.",
    conditions: { kind: "축제·행사", subtype: "전시·박람회", notice: "festival", cost: "unknown", costDetails: "입장료는 공식 공지 확인", visit: "ticket", solo: "yes", eligibility: "", preparation: "공식 공지의 입장·코스프레 규정 확인", exceptions: "일정은 주최 사정에 따라 변경될 수 있음", benefitConditions: "" },
  },
];
