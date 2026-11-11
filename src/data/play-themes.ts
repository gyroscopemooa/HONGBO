// 랜딩 화면 테마 섹션. slug는 PLAY_PLACES에 존재해야 하며(테스트로 검증), 순서는 편집자가 정합니다.
export type PlayTheme = { id: string; title: string; eyebrow: string; description: string; slugs: string[]; more?: { href: string; label: string } };
export const PLAY_THEMES: PlayTheme[] = [
  { id: "theme-date", title: "커플 데이트 추천", eyebrow: "A DAY FOR TWO", description: "산책·야경·체험으로 고르는 둘만의 하루. 전체 8곳은 데이트 추천 페이지에서 볼 수 있어요.", slugs: ["taehwagang-garden", "donggung-wolji", "pohang-spacewalk", "blueline-park"], more: { href: "/play/dates", label: "데이트 명소 8곳 모두 보기" } },
  { id: "theme-family", title: "가족 나들이 추천", eyebrow: "FAMILY DAY", description: "아이와 함께 걷고 배우고 쉬어 가기 좋은 곳. 시설별 운영·요금은 공식 안내로 한 번 더 확인하세요.", slugs: ["kids-science-gwacheon", "kids-grand-park-seoul", "seoul-forest-park", "kids-museum-national", "lotte-world"] },
  { id: "theme-nature", title: "국내 명소·자연", eyebrow: "NATURE", description: "습지와 숲, 대숲을 천천히 걷는 자연 나들이.", slugs: ["suncheonbay-wetland", "upo-wetland-changnyeong", "juknokwon-damyang", "bijarim-jeju"] },
  { id: "theme-mountain", title: "산·등산하기 좋은 곳", eyebrow: "HIKING", description: "코스 난이도와 통제 여부를 확인하고 오르는 대표 탐방지. 겨울에는 결빙과 일몰 시각을 꼭 확인하세요.", slugs: ["bukhansan-hiking", "seoraksan-ulsanbawi", "hallasan-seongpanak", "jirisan-nogodan"] },
  { id: "theme-sea", title: "바다 여행", eyebrow: "SEA", description: "동해·서해·남해의 대표 해변과 바다 산책 코스.", slugs: ["gyeongpo-beach", "sokcho-beach", "kkotji-beach-taean", "dadaepo-beach", "haeundae", "daewangam-park", "huinnyeoul"] },
  { id: "theme-river", title: "강·호수 산책", eyebrow: "RIVERSIDE", description: "강변과 다리, 두 물이 만나는 곳에서 천천히 걷는 하루.", slugs: ["ttukseom-hangang", "dumulmeori-yangpyeong", "woryeonggyo-andong", "taehwagang-garden"] },
  { id: "theme-sunrise", title: "해돋이 보기 좋은 곳", eyebrow: "SUNRISE", description: "일출 시각은 날짜마다 달라요. 한국천문연구원 등 공식 계산 자료로 당일 시각을 확인하고 일찍 도착하세요.", slugs: ["jeongdongjin-sunrise", "seongsan-ilchulbong", "ganjeolgot-sunrise", "naksansa-sunrise", "homigot-sunrise-2027"] },
  { id: "theme-fishing", title: "낚시·얼음낚시", eyebrow: "FISHING", description: "겨울 얼음낚시 축제와 낚시 이용 안내. 결빙·요금·구역은 공식 공지를 확인해야 해요.", slugs: ["hwacheon-ice-festival-2027", "hongcheon-ice-festival-2027", "inje-smelt-festival-2027", "hangang-fishing-guide"] },
  { id: "theme-hidden", title: "숨은 명소", eyebrow: "HIDDEN SPOTS", description: "한국관광공사가 2026년 강소형 잠재관광지로 선정한 것으로 보도된 곳들. 아직 덜 알려졌지만 걷기 좋은 곳이에요.", slugs: ["hidden-silre-village", "hidden-manhujeong", "hidden-ganggyeong", "hidden-byeolbit-nuri"] },
];
