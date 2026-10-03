import type { CategorySlug } from "@/lib/constants";
import type { Banner, Notice, PostExtra } from "@/lib/types";

/**
 * 운영자 초기 콘텐츠(seed).
 * - 모든 글은 is_seed=true 로 저장되어 관리자 페이지에서 한 번에 숨기거나 삭제할 수 있습니다.
 * - 실제 존재하는 제3자 업체/서비스가 아닌 가상 콘텐츠입니다.
 * - 조회수/후기/작성자 등은 만들지 않습니다. (조회수 0에서 시작, 작성자 없음)
 * - 외부 링크는 예약 도메인(example.com)을 가리키는 자리표시자입니다.
 *   실제 서비스로 교체하려면 관리자에서 해당 글을 숨기고 진짜 홍보글로 대체하세요.
 */

export interface SeedPost {
  id: number;
  category: CategorySlug;
  title: string;
  short: string;
  description: string;
  tags: string[];
  region?: string;
  price?: string;
  platform?: string;
  address?: string;
  extra?: PostExtra;
  /** 메인 "오늘의 인기 홍보"에 고정할 때의 큐레이션 순서 (1이 가장 앞) */
  curated?: number;
  /** 이미지 생성 모티프 / 팔레트 (scripts/gen-seed-images.ts 에서 사용) */
  motif: string;
  palette: number;
}

const link = (id: number) => `https://example.com/?from=thehongbo&p=${id}`;

export const SEED_POSTS: SeedPost[] = [
  // ───────── 앱/게임 ─────────
  {
    id: 1,
    category: "apps",
    title: "실시간 방송 번역 앱 TranStream",
    short: "해외 라이브·영상을 보면서 실시간 한국어 자막으로 즐겨요",
    description:
      "TranStream은 해외 라이브 방송과 영상을 보는 동안 실시간으로 한국어 자막을 띄워주는 번역 앱입니다.\n\n• 화면 위에 번역 자막을 겹쳐서 표시\n• 영어·일본어·중국어 등 주요 언어 지원\n• 자막 크기와 위치, 배경 투명도를 취향대로 조절\n• 자주 나오는 고유명사는 나만의 단어장으로 저장\n\n좋아하는 해외 방송을 언어 장벽 없이 편하게 즐겨보세요.",
    tags: ["번역", "자막", "라이브", "유틸리티"],
    platform: "android,ios",
    extra: { siteUrl: link(1) },
    curated: 1,
    motif: "phone-translate",
    palette: 0,
  },
  {
    id: 2,
    category: "apps",
    title: "하루 10분 습관 체크 앱",
    short: "큰 목표를 작게 쪼개서, 매일 10분씩 꾸준히 체크해요",
    description:
      "작심삼일을 끝내고 싶은 분들을 위해 만든 아주 가벼운 습관 체크 앱입니다.\n\n• 습관을 10분 단위의 작은 할 일로 나눠서 등록\n• 오늘 할 일만 크게 보여주는 단순한 화면\n• 연속 달성일과 주간 달성률을 한눈에 확인\n• 광고 없이 가볍게, 가입 없이 바로 시작\n\n운동, 공부, 독서, 어떤 습관이든 오늘부터 가볍게 시작해 보세요.",
    tags: ["습관", "루틴", "체크리스트", "생산성"],
    platform: "android,ios",
    extra: { siteUrl: link(2) },
    motif: "phone-habit",
    palette: 1,
  },
  {
    id: 3,
    category: "apps",
    title: "사진 한 장으로 오늘 메뉴 추천",
    short: "냉장고 속 재료를 찍으면 지금 만들 수 있는 메뉴를 알려줘요",
    description:
      "오늘 뭐 먹지? 고민될 때 냉장고 사진을 한 장 찍어 보세요.\n\n• 사진 속 재료를 인식해서 만들 수 있는 요리 추천\n• 15분 이내 간단 레시피 우선 정렬\n• 알레르기·못 먹는 재료는 미리 제외 설정\n• 장보기가 필요한 재료는 메모로 바로 저장\n\n식단 고민을 줄여주는 가벼운 라이프스타일 앱입니다.",
    tags: ["요리", "레시피", "라이프스타일", "식단"],
    platform: "android,ios",
    extra: { siteUrl: link(3) },
    motif: "phone-food",
    palette: 2,
  },
  {
    id: 4,
    category: "apps",
    title: "한 판 3분, 캐주얼 퍼즐게임 '조각맞춤'",
    short: "출퇴근 길에 가볍게 즐기는 조각 맞추기 퍼즐",
    description:
      "복잡한 설명 없이 바로 즐길 수 있는 캐주얼 퍼즐게임입니다.\n\n• 한 판 평균 3분, 짧게 끊어서 플레이\n• 200개 이상의 스테이지와 매일 바뀌는 데일리 퍼즐\n• 오프라인에서도 플레이 가능\n• 결제 유도 없이 광고 제거 옵션 제공 예정\n\n잠깐의 빈 시간에 머리를 말랑하게 풀어보세요.",
    tags: ["퍼즐", "캐주얼", "게임", "두뇌"],
    platform: "android,ios",
    extra: { siteUrl: link(4) },
    curated: 5,
    motif: "puzzle",
    palette: 3,
  },
  {
    id: 5,
    category: "apps",
    title: "여행 회화 메모 앱",
    short: "여행지에서 바로 보여줄 수 있는 회화 카드 모음",
    description:
      "여행 가서 자주 쓰는 문장을 카드로 만들어두고, 필요할 때 화면을 보여주는 방식의 회화 메모 앱입니다.\n\n• 식당, 교통, 숙소, 쇼핑 상황별 기본 문장 제공\n• 내가 자주 쓰는 문장을 직접 추가\n• 큰 글씨 모드로 상대방에게 바로 보여주기\n• 인터넷이 없어도 사용 가능\n\n짐은 가볍게, 말문은 든든하게 챙겨가세요.",
    tags: ["여행", "회화", "메모", "해외여행"],
    platform: "android,ios,web",
    extra: { siteUrl: link(5) },
    motif: "phone-travel",
    palette: 4,
  },

  // ───────── 웹사이트 ─────────
  {
    id: 6,
    category: "websites",
    title: "AI로 이력서 초안을 다듬는 웹서비스",
    short: "경력을 적으면 읽기 좋은 이력서 문장으로 정리해 줘요",
    description:
      "이력서 쓰는 게 막막할 때, 경력과 경험을 편하게 적기만 하세요. 읽기 좋은 문장으로 다듬어 이력서 초안을 만들어 드립니다.\n\n• 직무별 이력서 문장 가이드 제공\n• 성과 중심 표현으로 문장 다듬기\n• 완성본은 PDF로 바로 저장\n• 입력한 내용은 저장하지 않고 브라우저에서만 사용\n\n첫 이력서도, 이직 준비도 부담 없이 시작해 보세요.",
    tags: ["이력서", "AI", "취업", "이직"],
    extra: undefined,
    curated: 4,
    motif: "browser-resume",
    palette: 5,
  },
  {
    id: 7,
    category: "websites",
    title: "무료 이미지 사이즈 변환 도구",
    short: "가입 없이, 업로드 없이. 브라우저에서 바로 크기 변환",
    description:
      "블로그, SNS, 쇼핑몰에 맞는 이미지 크기를 한 번에 맞춰주는 무료 도구입니다.\n\n• 자주 쓰는 SNS·쇼핑몰 규격 프리셋 제공\n• 여러 장을 한 번에 변환\n• JPG / PNG / WebP 변환 지원\n• 이미지는 서버로 올라가지 않고 내 브라우저에서만 처리\n\n회원가입도 설치도 필요 없어요. 바로 열어서 쓰세요.",
    tags: ["이미지", "리사이즈", "무료도구", "웹도구"],
    curated: 7,
    motif: "browser-resize",
    palette: 6,
  },
  {
    id: 8,
    category: "websites",
    title: "링크 하나로 포트폴리오 만드는 페이지",
    short: "작업물 링크만 모으면 깔끔한 포트폴리오 페이지 완성",
    description:
      "디자이너, 개발자, 크리에이터를 위한 간단한 포트폴리오 페이지 메이커입니다.\n\n• 작업물 링크와 썸네일을 붙여넣기만 하면 카드로 정리\n• 나만의 주소로 공유 가능한 한 장짜리 페이지\n• 모바일에서도 보기 좋은 반응형 레이아웃\n• 코딩 없이 5분이면 완성\n\n이력서에 넣을 링크 하나, 오늘 만들어 보세요.",
    tags: ["포트폴리오", "링크모음", "디자이너", "개발자"],
    motif: "browser-portfolio",
    palette: 7,
  },
  {
    id: 9,
    category: "websites",
    title: "동네 행사 모아보는 웹사이트",
    short: "플리마켓, 전시, 공연… 이번 주말 우리 동네 행사 한눈에",
    description:
      "동네에서 열리는 작은 행사 소식을 한곳에 모아 보여주는 웹사이트입니다.\n\n• 지역과 날짜로 간단하게 행사 찾기\n• 플리마켓, 전시, 공연, 클래스 등 카테고리 분류\n• 행사 주최자는 누구나 무료로 소식 등록 가능\n• 주말 나들이 계획에 바로 쓰는 이번 주 추천\n\n근처에서 열리는 재미있는 행사를 놓치지 마세요.",
    tags: ["행사", "플리마켓", "지역", "주말"],
    motif: "browser-local",
    palette: 8,
  },
  {
    id: 10,
    category: "websites",
    title: "간단 견적 요청 페이지 만들기",
    short: "고객이 항목만 고르면 견적 요청이 바로 도착해요",
    description:
      "프리랜서와 소규모 사업자를 위한 견적 요청 페이지 생성 도구입니다.\n\n• 질문 항목을 골라 나만의 견적 폼 생성\n• 공유 링크 하나로 고객 요청 받기\n• 요청 내용은 이메일로 정리해서 전달\n• 복잡한 기능 없이 필요한 것만 담은 단순한 구성\n\n문의 주고받는 시간을 줄이고, 작업에 더 집중하세요.",
    tags: ["견적", "프리랜서", "폼", "소상공인"],
    motif: "browser-quote",
    palette: 9,
  },

  // ───────── 서비스 ─────────
  {
    id: 11,
    category: "services",
    title: "소상공인 무료 첫 상담 (마케팅 컨설팅)",
    short: "우리 가게 홍보, 어디서부터 해야 할지 30분 상담해 드려요",
    description:
      "가게를 열었지만 홍보가 막막한 소상공인 사장님을 위한 무료 첫 상담입니다.\n\n• 현재 사용 중인 홍보 채널 점검\n• 예산 없이 시작할 수 있는 홍보 아이디어 제안\n• 지역·업종에 맞는 우선순위 정리\n• 상담 후 바로 실행할 체크리스트 제공\n\n첫 30분 상담은 무료입니다. 편하게 신청해 주세요.",
    tags: ["마케팅", "컨설팅", "소상공인", "무료상담"],
    extra: { usageType: "online" },
    curated: 10,
    motif: "service-consult",
    palette: 10,
  },
  {
    id: 12,
    category: "services",
    title: "1인 사업자 상세페이지 점검해 드려요",
    short: "내 상세페이지, 구매 버튼 누르기 전에 이탈하는 이유를 찾아요",
    description:
      "스마트스토어, 자사몰, 포트폴리오 상세페이지를 객관적인 눈으로 점검해 드립니다.\n\n• 첫 화면 설득력, 구성 흐름, 문장 가독성 점검\n• 모바일 화면 기준으로 불편한 지점 체크\n• 개선 우선순위 3가지를 문서로 정리\n• 점검 후 1회 재문의 가능\n\n판매가 막혀 있다면 먼저 점검부터 받아보세요.",
    tags: ["상세페이지", "점검", "스마트스토어", "1인사업자"],
    extra: { usageType: "online" },
    motif: "service-review",
    palette: 11,
  },
  {
    id: 13,
    category: "services",
    title: "온라인 문서 정리 대행",
    short: "흩어진 파일과 문서를 깔끔한 폴더 구조로 정리해 드려요",
    description:
      "쌓여 있는 파일, 사진, 문서를 원격으로 정리해 드립니다.\n\n• 폴더 구조 설계부터 파일명 규칙 정리까지\n• 중복 파일 정리와 백업 구조 제안\n• 정리 후에도 유지하기 쉬운 간단한 사용 가이드\n• 개인·소규모 팀 모두 가능\n\n찾는 시간이 줄어들면 일하는 시간이 늘어납니다.",
    tags: ["문서정리", "대행", "파일관리", "원격"],
    extra: { usageType: "online" },
    motif: "service-docs",
    palette: 12,
  },
  {
    id: 14,
    category: "services",
    title: "영상 자막 정리 서비스",
    short: "받아쓰기 자막을 읽기 좋게 다듬고 타이밍까지 맞춰드려요",
    description:
      "유튜브, 강의, 인터뷰 영상의 자막을 보기 좋게 정리해 드립니다.\n\n• 자동 생성 자막의 오타·띄어쓰기 교정\n• 한 줄 길이와 줄바꿈 정리\n• SRT 파일 또는 영상용 자막 형태로 전달\n• 영상 길이에 따라 간단하게 견적 안내\n\n영상은 잘 만들었는데 자막이 고민이라면 맡겨주세요.",
    tags: ["자막", "영상편집", "유튜브", "교정"],
    extra: { usageType: "online" },
    motif: "service-subtitle",
    palette: 13,
  },
  {
    id: 15,
    category: "services",
    title: "홈페이지 사용성 피드백",
    short: "처음 보는 사람의 눈으로 홈페이지를 둘러보고 피드백을 드려요",
    description:
      "내가 만든 홈페이지가 처음 방문한 사람에게 이해되는지 확인해 보세요.\n\n• 첫 방문자 시선으로 둘러본 과정을 정리\n• 헷갈리는 메뉴, 놓치기 쉬운 버튼 짚어드리기\n• 모바일·PC 각각 확인\n• 개선하면 좋은 점을 짧은 문서로 전달\n\n오픈 전 점검이나 리뉴얼 전 의견이 필요할 때 추천해요.",
    tags: ["UX", "피드백", "홈페이지", "사용성"],
    extra: { usageType: "online" },
    motif: "service-feedback",
    palette: 0,
  },

  // ───────── 오프라인 가게 ─────────
  {
    id: 16,
    category: "offline",
    title: "울산 삼산동 감성 카페 ‘한잔의 오후’",
    short: "직접 로스팅한 원두와 라떼아트가 있는 조용한 동네 카페",
    description:
      "삼산동 골목 안쪽, 햇빛이 잘 드는 작은 카페입니다.\n\n• 매주 로스팅하는 싱글오리진 원두\n• 라떼아트가 예쁜 시그니처 라떼\n• 노트북 작업하기 좋은 콘센트 좌석\n• 반려견 동반 가능한 테라스 자리\n\n따뜻한 한 잔과 함께 여유로운 오후를 보내고 가세요.",
    tags: ["카페", "커피", "로스팅", "삼산동"],
    region: "울산",
    address: "울산 남구 삼산동 일대",
    curated: 2,
    motif: "cafe",
    palette: 1,
  },
  {
    id: 17,
    category: "offline",
    title: "부산 서면 수제버거 가게 ‘버거홀릭’",
    short: "두툼한 패티와 직접 만든 소스, 서면에서 즐기는 수제버거",
    description:
      "주문 즉시 구워내는 두툼한 수제 패티가 자랑인 서면의 버거 가게입니다.\n\n• 100% 소고기 패티, 매일 아침 굽는 번\n• 직접 만든 시그니처 소스\n• 감자튀김과 수제 레몬에이드 세트 구성\n• 혼밥 환영, 포장 가능\n\n퇴근길 든든한 한 끼가 필요할 때 들러보세요.",
    tags: ["수제버거", "서면", "맛집", "혼밥"],
    region: "부산",
    address: "부산 부산진구 서면 일대",
    curated: 6,
    motif: "burger",
    palette: 2,
  },
  {
    id: 18,
    category: "offline",
    title: "서울 성수 소형 공방 원데이 클래스",
    short: "도자기·가죽 소품을 직접 만들어보는 작은 공방",
    description:
      "성수동 골목의 작은 공방에서 원데이 클래스를 진행합니다.\n\n• 도자기 컵·접시, 가죽 카드지갑 클래스\n• 소규모 정원제로 천천히 알려드려요\n• 완성품은 포장해서 가져가기\n• 선물용·데이트 코스로 인기\n\n손으로 만드는 시간의 즐거움을 경험해 보세요.",
    tags: ["공방", "원데이클래스", "성수", "도자기"],
    region: "서울",
    address: "서울 성동구 성수동 일대",
    curated: 9,
    motif: "workshop",
    palette: 4,
  },
  {
    id: 19,
    category: "offline",
    title: "대전 1:1 PT 스튜디오",
    short: "처음 운동하는 분도 편안한 소규모 1:1 맞춤 PT",
    description:
      "운동이 처음이어도 부담 없이 시작할 수 있는 소규모 PT 스튜디오입니다.\n\n• 체형·목표에 맞춘 1:1 맞춤 프로그램\n• 한 타임 한 명, 프라이빗한 공간\n• 자세 교정과 기초 체력 중심 수업\n• 첫 상담 및 체험 문의 가능\n\n꾸준히 이어갈 수 있는 운동 습관을 함께 만들어 드립니다.",
    tags: ["PT", "헬스", "다이어트", "운동"],
    region: "대전",
    address: "대전 서구 둔산동 일대",
    motif: "gym",
    palette: 5,
  },
  {
    id: 20,
    category: "offline",
    title: "대구 예약제 미용실",
    short: "예약한 분께만 집중하는 조용한 1인 헤어 살롱",
    description:
      "한 번에 한 분만 시술하는 예약제 1인 미용실입니다.\n\n• 상담에 충분한 시간을 쓰는 맞춤 스타일링\n• 커트, 펌, 염색, 클리닉 가능\n• 예약 시간에 맞춰 대기 없이 진행\n• 조용하고 편안한 분위기\n\n내 머릿결과 얼굴형에 어울리는 스타일을 찾아드릴게요.",
    tags: ["미용실", "헤어", "예약제", "대구"],
    region: "대구",
    address: "대구 중구 동성로 일대",
    motif: "salon",
    palette: 6,
  },

  // ───────── 상품/판매 ─────────
  {
    id: 21,
    category: "products",
    title: "데스크 정리용 미니 수납함",
    short: "작은 책상도 깔끔하게. 펜·케이블·메모를 한 번에 정리",
    description:
      "좁은 책상 위를 단정하게 만들어주는 미니 수납함입니다.\n\n• 칸막이 4개로 펜, 메모, 케이블, 소품 분리 수납\n• 겹쳐 쌓을 수 있는 모듈 구조\n• 매트한 질감, 어떤 책상에도 어울리는 컬러\n• 가볍고 튼튼한 소재\n\n정리된 책상에서 집중력도 함께 올라갑니다.",
    tags: ["수납", "데스크테리어", "정리", "문구"],
    price: "12,900원",
    motif: "organizer",
    palette: 7,
  },
  {
    id: 22,
    category: "products",
    title: "프리미엄 무선 이어폰 파우치",
    short: "스크래치 걱정 없이 이어폰과 케이블을 한 번에 보관",
    description:
      "무선 이어폰과 충전 케이블을 함께 넣을 수 있는 슬림 파우치입니다.\n\n• 부드러운 안감으로 스크래치 방지\n• 케이블 보관용 메쉬 포켓\n• 가방 안에서도 부피를 적게 차지하는 슬림 디자인\n• 선물용으로도 좋은 깔끔한 컬러\n\n매일 들고 다니는 물건이니 예쁘고 튼튼한 걸로 챙기세요.",
    tags: ["이어폰", "파우치", "악세사리", "선물"],
    price: "19,800원",
    curated: 3,
    motif: "earbuds-pouch",
    palette: 8,
  },
  {
    id: 23,
    category: "products",
    title: "캠핑용 경량 랜턴",
    short: "손바닥만 한 크기, 밝기 3단계 조절 충전식 랜턴",
    description:
      "백패킹과 차박에 어울리는 경량 충전식 랜턴입니다.\n\n• 약 100g의 가벼운 무게\n• 밝기 3단계, 따뜻한 색감의 조명\n• USB 충전식, 걸어두는 고리 포함\n• 비 오는 날에도 안심인 생활 방수 설계\n\n캠핑장의 밤을 포근하게 밝혀주는 작은 랜턴입니다.",
    tags: ["캠핑", "랜턴", "백패킹", "차박"],
    price: "24,900원",
    curated: 12,
    motif: "lantern",
    palette: 14,
  },
  {
    id: 24,
    category: "products",
    title: "직접 만든 캐릭터 스티커 세트",
    short: "다이어리·노트북·폰케이스를 꾸미는 손그림 캐릭터 스티커",
    description:
      "직접 그린 캐릭터를 스티커로 만들었습니다.\n\n• 방수 코팅 스티커 30매 구성\n• 다이어리, 노트북, 텀블러 어디에든 붙이기 좋아요\n• 잘 떼지고 흔적이 남지 않는 접착\n• 소량 제작으로 정성껏 포장해 보내드려요\n\n일상에 작은 즐거움을 붙여보세요.",
    tags: ["스티커", "다꾸", "핸드메이드", "캐릭터"],
    price: "6,500원",
    motif: "stickers",
    palette: 10,
  },
  {
    id: 25,
    category: "products",
    title: "원두 드립백 세트 (10개입)",
    short: "뜨거운 물만 부으면 완성되는 향 좋은 스페셜티 드립백",
    description:
      "집에서도 사무실에서도 간편하게 즐기는 드립백 커피 세트입니다.\n\n• 로스팅 후 바로 소분한 신선한 원두\n• 산미와 단맛의 밸런스를 맞춘 블렌드\n• 개별 포장으로 휴대하기 편한 10개입\n• 선물 포장 가능\n\n바쁜 아침에도 한 잔의 여유를 챙겨보세요.",
    tags: ["드립백", "커피", "원두", "선물"],
    price: "9,900원",
    motif: "drip-bag",
    palette: 11,
  },

  // ───────── 콘텐츠(SNS) ─────────
  {
    id: 26,
    category: "content",
    title: "퇴근 후 1분 생활팁 쇼츠 채널",
    short: "청소·정리·요리, 1분이면 따라 하는 생활 꿀팁 모음",
    description:
      "퇴근하고 지친 저녁에도 1분이면 볼 수 있는 생활팁 쇼츠 채널입니다.\n\n• 청소, 정리, 간단 요리 등 생활 속 꿀팁\n• 군더더기 없이 핵심만 짧게\n• 매주 새로운 영상 업로드\n• 구독하고 알림 설정하면 놓치지 않아요\n\n하루에 하나씩, 생활이 조금씩 편해집니다.",
    tags: ["쇼츠", "생활팁", "유튜브", "꿀팁"],
    platform: "youtube",
    curated: 8,
    motif: "shorts",
    palette: 12,
  },
  {
    id: 27,
    category: "content",
    title: "직장인 개발 기록 블로그",
    short: "일하면서 배운 개발 지식과 시행착오를 솔직하게 기록해요",
    description:
      "현업 개발자가 일하면서 배운 것들을 차곡차곡 기록하는 블로그입니다.\n\n• 실무에서 마주친 문제와 해결 과정\n• 처음 배우는 분들을 위한 쉬운 설명\n• 사이드 프로젝트 회고\n• 이직·커리어 이야기\n\n같은 고민을 하는 분들께 도움이 되면 좋겠습니다.",
    tags: ["개발", "블로그", "개발자", "기록"],
    platform: "blog",
    motif: "blog",
    palette: 13,
  },
  {
    id: 28,
    category: "content",
    title: "혼밥 맛집 기록 인스타그램",
    short: "혼자 가도 편한 식당만 모았어요. 1인분 메뉴 위주 기록",
    description:
      "혼자 먹어도 어색하지 않은 식당만 골라 기록하는 계정입니다.\n\n• 1인석, 바 좌석이 있는 곳 위주\n• 메뉴 가격과 분위기를 솔직하게\n• 지역별로 정리한 하이라이트\n• 같이 가볼 만한 근처 장소도 함께\n\n혼밥 장소 고민될 때 구경하러 오세요.",
    tags: ["혼밥", "맛집", "인스타그램", "기록"],
    platform: "instagram",
    motif: "insta",
    palette: 0,
  },
  {
    id: 29,
    category: "content",
    title: "매일 한 문장 영어 계정",
    short: "하루 한 문장, 쉬운 영어 표현을 짧게 알려드려요",
    description:
      "부담 없이 매일 한 문장씩 익히는 영어 표현 계정입니다.\n\n• 실생활에서 바로 쓰는 쉬운 표현\n• 발음과 뉘앙스 설명을 짧게\n• 주말엔 한 주 복습 카드\n• 팔로우하면 피드에서 자연스럽게 학습\n\n작은 문장이 쌓이면 어느새 영어가 편해집니다.",
    tags: ["영어", "영어공부", "하루한문장", "학습"],
    platform: "threads",
    motif: "quote",
    palette: 1,
  },
  {
    id: 30,
    category: "content",
    title: "AI 도구 사용기 채널",
    short: "새로 나온 AI 도구를 직접 써보고 솔직하게 정리해요",
    description:
      "새로 나온 AI 도구들을 직접 써보고 장단점을 솔직하게 정리하는 채널입니다.\n\n• 실제 업무·일상에서 써본 후기 위주\n• 무료로 쓸 수 있는 도구 우선 소개\n• 초보자도 따라 할 수 있는 활용법\n• 도구별 비교 정리\n\nAI 도구 고르기가 어려울 때 참고해 보세요.",
    tags: ["AI", "도구", "리뷰", "유튜브"],
    platform: "youtube",
    motif: "ai-channel",
    palette: 2,
  },

  // ───────── 이벤트/모집 ─────────
  {
    id: 31,
    category: "events",
    title: "신규 앱 베타테스터 모집",
    short: "출시 전 앱을 먼저 써보고 의견을 나눠주실 분을 찾아요",
    description:
      "출시를 앞둔 앱의 베타테스터를 모집합니다.\n\n• 앱을 먼저 써보고 불편한 점을 알려주세요\n• 간단한 설문 1회와 사용 후기 요청\n• Android 사용자 우선 모집\n• 참여해 주신 분은 정식 출시 소식을 가장 먼저 안내\n\n작은 의견이 앱을 더 좋게 만듭니다.",
    tags: ["베타테스터", "앱", "모집", "테스트"],
    extra: { period: "상시 모집" },
    curated: 11,
    motif: "beta",
    palette: 3,
  },
  {
    id: 32,
    category: "events",
    title: "동네 플리마켓 셀러 모집",
    short: "핸드메이드·빈티지·중고 셀러를 모집합니다",
    description:
      "정기적으로 열리는 동네 플리마켓에서 함께할 셀러를 모집합니다.\n\n• 핸드메이드, 빈티지, 중고 물품 모두 가능\n• 소규모 부스 단위 신청\n• 푸드 셀러는 사전 문의\n• 신청 링크에서 참가 안내 확인\n\n작은 가게를 시작해 보고 싶은 분들도 환영합니다.",
    tags: ["플리마켓", "셀러", "모집", "핸드메이드"],
    region: "경기",
    extra: { period: "매월 1회 정기 개최" },
    motif: "market",
    palette: 4,
  },
  {
    id: 33,
    category: "events",
    title: "온라인 스터디 멤버 모집",
    short: "주 2회 온라인으로 함께 공부할 스터디 멤버를 찾아요",
    description:
      "혼자서는 꾸준히 하기 어려운 공부, 같이 해봐요.\n\n• 주 2회 온라인 모임 (1시간)\n• 각자 목표를 공유하고 진행 상황 체크\n• 편안한 분위기, 부담 없는 참여\n• 직장인·학생 모두 환영\n\n신청 링크에서 간단한 소개만 남겨주세요.",
    tags: ["스터디", "온라인", "모집", "자기계발"],
    extra: { period: "자리가 찰 때까지" },
    motif: "study",
    palette: 5,
  },
  {
    id: 34,
    category: "events",
    title: "서비스 사용성 인터뷰 참가자 모집",
    short: "30분 온라인 인터뷰로 서비스 개선에 의견을 보태주세요",
    description:
      "개선 중인 서비스에 대해 의견을 들려주실 인터뷰 참가자를 모집합니다.\n\n• 온라인(화상) 30분 진행\n• 편한 시간대를 선택해 신청\n• 질문은 사용 경험 중심, 정답은 없어요\n• 참여해 주신 분께 소정의 감사 인사를 준비 중\n\n솔직한 이야기가 가장 큰 도움이 됩니다.",
    tags: ["인터뷰", "사용성", "모집", "UX"],
    extra: { period: "상시 모집" },
    motif: "interview",
    palette: 6,
  },

  // ───────── 자유홍보 ─────────
  {
    id: 35,
    category: "free",
    title: "개인 포트폴리오 구경해주세요",
    short: "디자인과 개발 작업물을 모아둔 제 포트폴리오입니다",
    description:
      "그동안 만든 디자인과 개발 작업물을 한곳에 모았습니다.\n\n• 웹/앱 UI 작업\n• 브랜딩과 로고 작업\n• 사이드 프로젝트 기록\n\n편하게 둘러보시고 의견 주시면 큰 힘이 됩니다.",
    tags: ["포트폴리오", "디자인", "개발", "작업물"],
    motif: "portfolio",
    palette: 7,
  },
  {
    id: 36,
    category: "free",
    title: "새로 만든 뉴스레터를 소개합니다",
    short: "매주 한 번, 일상 속 작은 영감을 메일로 보내드려요",
    description:
      "일상에서 발견한 작은 영감과 읽을거리를 매주 한 번 정리해 보내는 뉴스레터입니다.\n\n• 주 1회, 5분이면 읽는 분량\n• 책, 영상, 생각 정리\n• 구독은 무료, 언제든 해지 가능\n\n가볍게 구독해 보세요.",
    tags: ["뉴스레터", "구독", "영감", "읽을거리"],
    motif: "newsletter",
    palette: 8,
  },
  {
    id: 37,
    category: "free",
    title: "팀 프로젝트 멤버를 찾습니다",
    short: "사이드 프로젝트를 함께 만들어갈 기획·디자인·개발 팀원 모집",
    description:
      "작은 서비스를 같이 만들어갈 팀원을 찾고 있습니다.\n\n• 기획, 디자인, 프론트엔드, 백엔드 모두 환영\n• 주 1~2회 가벼운 온라인 미팅\n• 아이디어 단계부터 함께 이야기해요\n\n관심 있으신 분은 링크에서 편하게 연락 주세요.",
    tags: ["팀원모집", "사이드프로젝트", "협업", "스타트업"],
    motif: "team",
    palette: 9,
  },
  {
    id: 38,
    category: "free",
    title: "작은 브랜드 첫 오픈 소식",
    short: "작게 시작하는 우리 브랜드, 첫 인사를 드립니다",
    description:
      "오랜 준비 끝에 작은 브랜드를 열었습니다.\n\n• 정성껏 만든 제품을 소량씩 선보여요\n• 브랜드 이야기와 첫 제품은 링크에서 확인\n• 오픈 기념 소식은 가장 먼저 알려드릴게요\n\n따뜻한 관심 부탁드립니다.",
    tags: ["신규오픈", "브랜드", "오픈소식", "소규모"],
    motif: "open",
    palette: 10,
  },
];

/** 메인 최신 목록에서 카테고리가 고르게 섞여 보이도록 한 최신순(위에서부터 최근) */
export const SEED_ORDER: number[] = [
  6, 11, 21, 26, 17, 35, 1, 16, 31, 7, 22, 27, 12, 36, 2, 18, 32, 8, 23, 28, 13, 37, 3, 19, 33, 9, 24, 29, 14, 38, 4,
  20, 34, 10, 25, 30, 15, 5,
];

export function seedExternalUrl(id: number): string {
  return link(id);
}

export function seedImageUrl(id: number): string {
  return `/seed/${String(id).padStart(2, "0")}.svg`;
}

export const SEED_BANNERS: Omit<Banner, "id">[] = [
  {
    title: "뭐든 홍보하세요. 등록은 무료!",
    subtitle: "앱·가게·상품·콘텐츠 무엇이든 1분이면 등록",
    imageUrl: null,
    targetUrl: "/write",
    placement: "side",
    theme: "coral",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "새로운 홍보를 매일 발견하세요.",
    subtitle: "방금 올라온 홍보글 보러가기",
    imageUrl: null,
    targetUrl: "/posts?sort=latest",
    placement: "side",
    theme: "amber",
    sortOrder: 2,
    isActive: true,
  },
  {
    title: "앱 만들었는데 알릴 곳이 없다면?",
    subtitle: "설치 링크와 함께 앱·게임 홍보",
    imageUrl: null,
    targetUrl: "/category/apps",
    placement: "strip",
    theme: "blue",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "우리 가게, 동네 사람들에게 알려보세요.",
    subtitle: "카페·음식점·공방 오프라인 가게 홍보",
    imageUrl: null,
    targetUrl: "/category/offline",
    placement: "strip",
    theme: "mint",
    sortOrder: 2,
    isActive: true,
  },
  {
    title: "상품·서비스·콘텐츠까지 한 번에",
    subtitle: "카테고리 제한 없이 모든 홍보를 한곳에서",
    imageUrl: null,
    targetUrl: "/posts",
    placement: "strip",
    theme: "violet",
    sortOrder: 3,
    isActive: true,
  },
];

export const SEED_NOTICES: Array<Omit<Notice, "id">> = [
  {
    title: "더홍보 오픈 안내",
    body: "누구나 무료로 앱·사이트·가게·상품·서비스를 홍보할 수 있는 더홍보가 문을 열었습니다. 로그인 후 1분이면 홍보글을 올릴 수 있어요.",
    isPinned: true,
    publishedAt: "",
  },
  {
    title: "홍보글 작성 시 꼭 확인해주세요",
    body: "제목과 한 줄 소개는 짧고 분명하게, 대표 이미지는 1장 이상 등록하면 더 눈에 잘 띕니다. 링크는 http 또는 https 주소만 사용할 수 있어요.",
    isPinned: false,
    publishedAt: "",
  },
  {
    title: "불법·사기·성인·도배 홍보는 삭제될 수 있습니다",
    body: "불법 상품·서비스, 사기·피싱, 성인·불법 도박, 타인 사칭, 반복 도배 홍보는 사전 안내 없이 숨김 또는 삭제될 수 있습니다. 자세한 내용은 운영정책을 확인해주세요.",
    isPinned: false,
    publishedAt: "",
  },
  {
    title: "외부 링크 이용 시 거래 조건을 직접 확인해주세요",
    body: "더홍보는 홍보 공간을 제공하는 플랫폼이며 거래의 당사자가 아닙니다. 외부 사이트에서의 구매·계약·결제는 각 판매자의 조건을 직접 확인한 뒤 진행해주세요.",
    isPinned: false,
    publishedAt: "",
  },
];
