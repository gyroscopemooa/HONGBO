export const SITE = {
  name: "더홍보",
  domain: "www.thehongbo.com",
  tagline: "앱도, 가게도, 사이트도, 물건도. 그냥 홍보하세요.",
  slogan: "세상의 모든 홍보가 여기에!",
  description:
    "더홍보는 앱·웹사이트·가게·상품·서비스를 누구나 마음껏 무료로 홍보할 수 있는 홍보 사이트입니다. 회원가입 후 글 한 번이면 끝, 무료 홍보·마케팅 게시판에 지금 바로 홍보글을 올려보세요.",
  /** 검색 결과 제목용 — 핵심 검색어(홍보사이트·무료홍보)를 앞쪽에 둡니다. */
  seoTitle: "더홍보 - 무료 홍보 사이트 | 마음껏 홍보 가능한 홍보사이트·마케팅 사이트",
  /** 이 사이트를 찾을 때 쓰일 검색어 */
  keywords: [
    "홍보사이트",
    "홍보 사이트",
    "무료홍보",
    "무료 홍보",
    "무료홍보사이트",
    "무료 홍보 사이트",
    "마케팅사이트",
    "마케팅 사이트",
    "무료 마케팅",
    "홍보 게시판",
    "무료 광고 사이트",
    "광고 사이트",
    "마음껏 홍보",
    "홍보 가능한 사이트",
    "앱 홍보",
    "가게 홍보",
    "사이트 홍보",
    "상품 홍보",
    "서비스 홍보",
    "더홍보",
    "thehongbo",
  ],
};

export type CategorySlug =
  | "apps"
  | "websites"
  | "services"
  | "offline"
  | "products"
  | "content"
  | "events"
  | "free";

export interface CategoryInfo {
  slug: CategorySlug;
  name: string;
  /** 모바일 칩/좁은 공간용 이름 */
  short: string;
  /** 카드/상세의 외부 이동 버튼 기본 라벨 */
  cta: string;
  desc: string;
  /** 대표 색(글자/아이콘) */
  color: string;
  /** 옅은 배경색 */
  tint: string;
  defaultImage: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    slug: "apps",
    name: "앱/게임",
    short: "앱·게임",
    cta: "앱 설치하기",
    desc: "직접 만든 앱과 게임, 설치 링크와 함께 소개하세요.",
    color: "#4f7bff",
    tint: "#eef3ff",
    defaultImage: "/defaults/apps.svg",
  },
  {
    slug: "websites",
    name: "웹사이트",
    short: "웹사이트",
    cta: "사이트 방문하기",
    desc: "웹서비스, 도구, 포트폴리오 사이트를 알려보세요.",
    color: "#14a38f",
    tint: "#e7f8f4",
    defaultImage: "/defaults/websites.svg",
  },
  {
    slug: "services",
    name: "서비스",
    short: "서비스",
    cta: "서비스 보러가기",
    desc: "상담, 대행, 강의 등 내가 제공하는 서비스를 소개하세요.",
    color: "#9156f0",
    tint: "#f3edff",
    defaultImage: "/defaults/services.svg",
  },
  {
    slug: "offline",
    name: "오프라인 가게",
    short: "오프라인 가게",
    cta: "매장 정보 보기",
    desc: "카페, 음식점, 공방, 헬스장… 우리 동네 가게를 알려보세요.",
    color: "#2f80ed",
    tint: "#e9f2ff",
    defaultImage: "/defaults/offline.svg",
  },
  {
    slug: "products",
    name: "상품/판매",
    short: "상품·판매",
    cta: "구매하러 가기",
    desc: "직접 만들거나 파는 상품을 소개하고 판매 링크로 연결하세요.",
    color: "#f08a00",
    tint: "#fff3dd",
    defaultImage: "/defaults/products.svg",
  },
  {
    slug: "content",
    name: "콘텐츠(SNS)",
    short: "콘텐츠(SNS)",
    cta: "콘텐츠 보기",
    desc: "유튜브, 블로그, 인스타그램 등 내 채널과 콘텐츠를 알려보세요.",
    color: "#6366f1",
    tint: "#eeeeff",
    defaultImage: "/defaults/content.svg",
  },
  {
    slug: "events",
    name: "이벤트/모집",
    short: "이벤트·모집",
    cta: "참여/신청하기",
    desc: "이벤트, 체험단, 베타테스터, 팀원 모집 소식을 전하세요.",
    color: "#e5484d",
    tint: "#ffecec",
    defaultImage: "/defaults/events.svg",
  },
  {
    slug: "free",
    name: "자유홍보",
    short: "자유홍보",
    cta: "바로가기",
    desc: "어디에도 딱 맞지 않는 홍보는 여기에 자유롭게 올려주세요.",
    color: "#0e9ad8",
    tint: "#e5f5fd",
    defaultImage: "/defaults/free.svg",
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, CategoryInfo>;

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as CategorySlug[];

export function isCategorySlug(v: unknown): v is CategorySlug {
  return typeof v === "string" && v in CATEGORY_MAP;
}

export const REGIONS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

export const APP_PLATFORMS = [
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
  { value: "web", label: "Web" },
  { value: "other", label: "기타" },
] as const;

export const SNS_PLATFORMS = [
  { value: "youtube", label: "유튜브" },
  { value: "blog", label: "블로그" },
  { value: "instagram", label: "인스타그램" },
  { value: "x", label: "X(트위터)" },
  { value: "tiktok", label: "틱톡" },
  { value: "threads", label: "스레드" },
  { value: "other", label: "기타" },
] as const;

export const USAGE_TYPES = [
  { value: "online", label: "온라인" },
  { value: "offline", label: "오프라인" },
  { value: "mixed", label: "온·오프라인 혼합" },
] as const;

export const PLATFORM_LABELS: Record<string, string> = Object.fromEntries(
  [...APP_PLATFORMS, ...SNS_PLATFORMS, ...USAGE_TYPES].map((p) => [p.value, p.label]),
);

export const REPORT_REASONS = [
  { value: "illegal", label: "불법 상품·서비스" },
  { value: "scam", label: "사기·피싱·악성코드" },
  { value: "adult", label: "성인·선정적 콘텐츠" },
  { value: "violence", label: "폭력·도박 등 법률상 문제" },
  { value: "impersonation", label: "타인 사칭" },
  { value: "spam", label: "도배·스팸" },
  { value: "copyright", label: "권리 침해" },
  { value: "broken", label: "링크 오류·삭제된 콘텐츠" },
  { value: "other", label: "기타" },
] as const;

export const REPORT_REASON_LABELS: Record<string, string> = Object.fromEntries(
  REPORT_REASONS.map((r) => [r.value, r.label]),
);

/** 입력/운영 한도 — 나중에 쉽게 바꿀 수 있도록 한 곳에 둡니다. */
export const LIMITS = {
  titleMax: 60,
  shortMax: 80,
  descMin: 10,
  descMax: 5000,
  tagsMax: 5,
  tagMax: 20,
  extraImagesMax: 4,
  priceMax: 30,
  addressMax: 120,
  contactMax: 100,
  /** 일반 글 노출 기간(일). 갱신(다시 홍보하기)하면 이 기간만큼 다시 연장됩니다. */
  postLifetimeDays: 60,
  /** 계정당 연속 등록 제한 */
  postsPer10Min: 3,
  postsPerDay: 10,
  pageSize: 20,
  /** 최근 N시간의 유효 이벤트로 자동 인기순을 계산 */
  popularWindowHours: 72,
  /** 이 개수 이상의 유효 이벤트가 쌓이면 운영자 큐레이션 대신 자동 인기순으로 전환 */
  autoPopularMinEvents: 300,
  /** 카드에 조회수를 표시하는 최소 실제 조회수 */
  showViewsFrom: 10,
  uploadMaxBytes: 4 * 1024 * 1024,
};

export const PAGE_SIZE = LIMITS.pageSize;
