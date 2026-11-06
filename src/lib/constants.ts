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
    "이벤트 모음",
    "이벤트 사이트",
    "진행중인 이벤트",
    "할인 쿠폰 모음",
    "무료 체험",
    "이벤트 참여",
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
  | "free"
  | "quick";

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
  {
    slug: "quick",
    name: "한줄홍보",
    short: "한줄홍보",
    cta: "바로가기",
    desc: "링크가 없어도 괜찮아요. 가볍게 한두 줄로 알리는 홍보예요.",
    color: "#e0569b",
    tint: "#ffeaf4",
    defaultImage: "/defaults/quick.svg",
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, CategoryInfo>;

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as CategorySlug[];

/** 커뮤니티의 '홍보글 쓰는 법' 안내 글 */
export const WRITING_GUIDE_PATH = "/community/8ca6c06d-0eac-4fa8-8e30-784fe0ba5134";

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
  postLifetimeDays: 180,
  /** 계정당 연속 등록 제한 */
  postsPer10Min: 3,
  postsPerDay: 10,
  pageSize: 20,
  /** 최근 N시간의 유효 이벤트로 자동 인기순을 계산 */
  popularWindowHours: 72,
  /** 이 개수 이상의 유효 이벤트가 쌓이면 운영자 큐레이션 대신 자동 인기순으로 전환 */
  autoPopularMinEvents: 300,
  /** 카드에 조회수를 표시하는 최소 실제 조회수 */
  showViewsFrom: 1000,
  /** 링크 클릭 수는 이 값 이상일 때만 작성자 화면에 표시 (적은 숫자가 위축 요인이 되지 않도록) */
  showClicksFrom: 100,
  uploadMaxBytes: 4 * 1024 * 1024,
};

export const PAGE_SIZE = LIMITS.pageSize;

/** 홍보글 혜택 배지 (글쓴이가 실제로 제공하는 혜택만 선택) */
export const BENEFITS = [
  { value: "event", label: "이벤트" },
  { value: "discount", label: "할인" },
  { value: "coupon", label: "쿠폰" },
  { value: "free", label: "무료" },
  { value: "gift", label: "증정" },
] as const;
export const BENEFIT_MAX = 2;

export type BenefitSlug = (typeof BENEFITS)[number]["value"];

/** 더홍보 전용 이벤트: 더홍보를 보고 온 분에게만 제공하는 혜택. benefits 배열에 이 값이 함께 저장돼 모음 페이지에 분류됩니다. */
export const EXCLUSIVE_SLUG = "exclusive" as const;
export const EXCLUSIVE_REWARD_MAX = 60;
export const EXCLUSIVE_HOW_MAX = 80;
export const EXCLUSIVE_LABEL = "더홍보 전용";
export const EXCLUSIVE_CODE_MAX = 40;
/** 전용 혜택 받는 방식 */
export const EXCLUSIVE_METHODS = [
  { value: "say", label: "말로 알리기", hint: "가게·오프라인용. 방문 시 \"더홍보 보고 왔어요\"라고 말하면 제공" },
  { value: "code", label: "쿠폰·코드", hint: "사이트·서비스용. 쿠폰 번호를 보여주고 복사할 수 있어요" },
  { value: "link", label: "외부 링크", hint: "외부 이벤트·신청 페이지로 연결해요. 설문 응답은 더홍보에 저장되지 않아요" },
  { value: "survey", label: "더홍보 설문", hint: "더홍보 안에서 설문을 받고, 내 홍보글에서 결과를 확인해요" },
] as const;
export type ExclusiveMethod = (typeof EXCLUSIVE_METHODS)[number]["value"];
export const SURVEY_MAX_QUESTIONS = 5;
export const SURVEY_MAX_OPTIONS = 6;
export const SURVEY_QUESTION_MAX = 100;
export const SURVEY_OPTION_MAX = 60;
export const SURVEY_ANSWER_MAX = 500;
export const SURVEY_CONTACT_MAX = 100;
/** 설문 응답 안에서 추첨 연락처를 구분하는 예약 ID (질문 ID는 이 값을 쓸 수 없음) */
export const SURVEY_CONTACT_ID = "__contact";
export const SURVEY_PAYOUTS = [
  { value: "instant", label: "즉시 지급", hint: "설문을 제출하면 완료 화면에 쿠폰 코드를 바로 보여줘요. 연락처를 받지 않아요." },
  { value: "draw", label: "추첨 안내", hint: "참여자의 이메일 또는 휴대폰 번호를 받아 당첨자에게 업체가 직접 연락해요." },
  { value: "none", label: "혜택 없음", hint: "의견 수집만 해요." },
] as const;
/** 더홍보 전용 링크에 자동으로 붙는 유입 표시 */
export function withExclusiveRef(url: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "thehongbo");
    if (!u.searchParams.has("utm_medium")) u.searchParams.set("utm_medium", "exclusive");
    return u.toString();
  } catch {
    return url;
  }
}

/** 혜택 모음 페이지(/benefit/[slug]) 정보 — 등록된 글의 혜택 배지로 자동 분류됩니다. */
export const BENEFIT_PAGES: Record<
  BenefitSlug | typeof EXCLUSIVE_SLUG,
  { label: string; title: string; h1: string; desc: string; intro: string; color: string; tint: string }
> = {
  exclusive: {
    label: EXCLUSIVE_LABEL,
    title: "더홍보 전용 이벤트 - 더홍보에서만 받을 수 있는 혜택",
    h1: "더홍보 전용 이벤트",
    desc: "더홍보를 보고 온 분에게만 제공하는 더홍보 전용 혜택을 모았어요. 더홍보 전용 할인, 증정, 체험 이벤트를 확인하세요.",
    intro: "다른 곳에서는 받을 수 없는, 더홍보 전용 혜택만 모았어요. 받는 방법은 각 글에서 확인하세요.",
    color: "#b7791f",
    tint: "#fff6e0",
  },
  event: {
    label: "이벤트",
    title: "진행 중인 이벤트 모음 - 경품·응모·참여 이벤트 한눈에",
    h1: "진행 중인 이벤트 모음",
    desc: "앱·가게·쇼핑몰·채널이 직접 올린 진행 중인 이벤트를 한곳에서 모아보세요. 경품, 응모, 참여 이벤트를 놓치지 않고 확인할 수 있어요.",
    intro: "업체와 크리에이터가 직접 등록한 이벤트만 모았어요. 참여 방법과 기간은 각 글에서 확인하세요.",
    color: "#e5484d",
    tint: "#ffecec",
  },
  discount: {
    label: "할인",
    title: "할인 정보 모음 - 지금 받을 수 있는 할인 혜택",
    h1: "할인 정보 모음",
    desc: "가게·상품·서비스의 할인 소식을 한곳에서 확인하세요. 오픈 기념 할인, 첫 주문 할인 등 등록된 할인 혜택을 모았어요.",
    intro: "할인 조건과 기간이 적힌 홍보글만 모았어요. 자세한 조건은 각 글에서 확인하세요.",
    color: "#f08a00",
    tint: "#fff3dd",
  },
  coupon: {
    label: "쿠폰",
    title: "쿠폰 모음 - 받을 수 있는 쿠폰·프로모션 코드",
    h1: "쿠폰 모음",
    desc: "받을 수 있는 쿠폰과 프로모션 혜택을 모아봤어요. 사용 조건과 기간은 각 글에서 확인하세요.",
    intro: "쿠폰을 제공하는 홍보글만 모았어요. 발급 방법은 글마다 달라요.",
    color: "#9156f0",
    tint: "#f3edff",
  },
  free: {
    label: "무료",
    title: "무료 체험·무료 이용 모음 - 공짜로 써볼 수 있는 서비스",
    h1: "무료 체험·무료 이용 모음",
    desc: "무료 체험, 무료 이용, 무료 나눔 혜택을 제공하는 앱·서비스·가게를 모았어요.",
    intro: "무료로 이용하거나 체험할 수 있는 홍보글만 모았어요. 무료 범위는 각 글에서 확인하세요.",
    color: "#14a38f",
    tint: "#e7f8f4",
  },
  gift: {
    label: "증정",
    title: "증정 이벤트 모음 - 사은품·샘플·무료 증정",
    h1: "증정 이벤트 모음",
    desc: "사은품, 샘플, 서비스 증정 혜택이 있는 홍보글을 모았어요.",
    intro: "증정 혜택을 제공하는 홍보글만 모았어요. 수량과 조건은 각 글에서 확인하세요.",
    color: "#2f80ed",
    tint: "#e9f2ff",
  },
};

export function isBenefitSlug(v: unknown): v is BenefitSlug | typeof EXCLUSIVE_SLUG {
  return typeof v === "string" && v in BENEFIT_PAGES;
}

/** 추가 링크(이벤트 참여, 쿠폰 받기 등) — 제목은 직접 입력하거나 빠른 선택으로 채웁니다. */
export const EXTRA_LINK_MAX = 5;
export const EXTRA_LINK_LABEL_MAX = 20;
export const EXTRA_LINK_PRESETS = ["이벤트 참여", "쿠폰 받기", "예약하기", "공식 홈페이지", "카카오채널"] as const;
export function benefitLabels(values?: string[]): string[] {
  const labels: string[] = [];
  for (const v of values ?? []) {
    const found = BENEFITS.find((b) => b.value === v);
    if (found) labels.push(found.label);
  }
  return labels;
}
