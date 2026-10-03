-- 자동 생성 파일입니다. (npm run seed:sql)
-- 더홍보 운영자 초기 콘텐츠: 홍보글 38개 / 배너 5개 / 공지 4개
-- 홍보글 이미지는 사이트의 /seed/*.svg 파일을 가리킵니다. (public/seed 폴더가 함께 배포되어야 해요)

begin;

insert into public.posts
  (id, category, title, short_description, description, primary_image_url, external_url, platform, price, region, address, tags, extra, status, admin_pinned, curated_rank, is_seed, published_at, bumped_at, updated_at)
overriding system value
values
  (1, 'apps', '실시간 방송 번역 앱 TranStream', '해외 라이브·영상을 보면서 실시간 한국어 자막으로 즐겨요', 'TranStream은 해외 라이브 방송과 영상을 보는 동안 실시간으로 한국어 자막을 띄워주는 번역 앱입니다.

• 화면 위에 번역 자막을 겹쳐서 표시
• 영어·일본어·중국어 등 주요 언어 지원
• 자막 크기와 위치, 배경 투명도를 취향대로 조절
• 자주 나오는 고유명사는 나만의 단어장으로 저장

좋아하는 해외 방송을 언어 장벽 없이 편하게 즐겨보세요.', '/seed/01.svg', 'https://example.com/?from=thehongbo&p=1', 'android,ios', null, null, null, array['번역', '자막', '라이브', '유틸리티']::text[], '{"siteUrl":"https://example.com/?from=thehongbo&p=1"}'::jsonb, 'active', true, 1, true, now() - interval '14 minutes', now() - interval '14 minutes', now() - interval '14 minutes'),
  (2, 'apps', '하루 10분 습관 체크 앱', '큰 목표를 작게 쪼개서, 매일 10분씩 꾸준히 체크해요', '작심삼일을 끝내고 싶은 분들을 위해 만든 아주 가벼운 습관 체크 앱입니다.

• 습관을 10분 단위의 작은 할 일로 나눠서 등록
• 오늘 할 일만 크게 보여주는 단순한 화면
• 연속 달성일과 주간 달성률을 한눈에 확인
• 광고 없이 가볍게, 가입 없이 바로 시작

운동, 공부, 독서, 어떤 습관이든 오늘부터 가볍게 시작해 보세요.', '/seed/02.svg', 'https://example.com/?from=thehongbo&p=2', 'android,ios', null, null, null, array['습관', '루틴', '체크리스트', '생산성']::text[], '{"siteUrl":"https://example.com/?from=thehongbo&p=2"}'::jsonb, 'active', false, null, true, now() - interval '30 minutes', now() - interval '30 minutes', now() - interval '30 minutes'),
  (3, 'apps', '사진 한 장으로 오늘 메뉴 추천', '냉장고 속 재료를 찍으면 지금 만들 수 있는 메뉴를 알려줘요', '오늘 뭐 먹지? 고민될 때 냉장고 사진을 한 장 찍어 보세요.

• 사진 속 재료를 인식해서 만들 수 있는 요리 추천
• 15분 이내 간단 레시피 우선 정렬
• 알레르기·못 먹는 재료는 미리 제외 설정
• 장보기가 필요한 재료는 메모로 바로 저장

식단 고민을 줄여주는 가벼운 라이프스타일 앱입니다.', '/seed/03.svg', 'https://example.com/?from=thehongbo&p=3', 'android,ios', null, null, null, array['요리', '레시피', '라이프스타일', '식단']::text[], '{"siteUrl":"https://example.com/?from=thehongbo&p=3"}'::jsonb, 'active', false, null, true, now() - interval '46 minutes', now() - interval '46 minutes', now() - interval '46 minutes'),
  (4, 'apps', '한 판 3분, 캐주얼 퍼즐게임 ''조각맞춤''', '출퇴근 길에 가볍게 즐기는 조각 맞추기 퍼즐', '복잡한 설명 없이 바로 즐길 수 있는 캐주얼 퍼즐게임입니다.

• 한 판 평균 3분, 짧게 끊어서 플레이
• 200개 이상의 스테이지와 매일 바뀌는 데일리 퍼즐
• 오프라인에서도 플레이 가능
• 결제 유도 없이 광고 제거 옵션 제공 예정

잠깐의 빈 시간에 머리를 말랑하게 풀어보세요.', '/seed/04.svg', 'https://example.com/?from=thehongbo&p=4', 'android,ios', null, null, null, array['퍼즐', '캐주얼', '게임', '두뇌']::text[], '{"siteUrl":"https://example.com/?from=thehongbo&p=4"}'::jsonb, 'active', true, 5, true, now() - interval '62 minutes', now() - interval '62 minutes', now() - interval '62 minutes'),
  (5, 'apps', '여행 회화 메모 앱', '여행지에서 바로 보여줄 수 있는 회화 카드 모음', '여행 가서 자주 쓰는 문장을 카드로 만들어두고, 필요할 때 화면을 보여주는 방식의 회화 메모 앱입니다.

• 식당, 교통, 숙소, 쇼핑 상황별 기본 문장 제공
• 내가 자주 쓰는 문장을 직접 추가
• 큰 글씨 모드로 상대방에게 바로 보여주기
• 인터넷이 없어도 사용 가능

짐은 가볍게, 말문은 든든하게 챙겨가세요.', '/seed/05.svg', 'https://example.com/?from=thehongbo&p=5', 'android,ios,web', null, null, null, array['여행', '회화', '메모', '해외여행']::text[], '{"siteUrl":"https://example.com/?from=thehongbo&p=5"}'::jsonb, 'active', false, null, true, now() - interval '76 minutes', now() - interval '76 minutes', now() - interval '76 minutes'),
  (6, 'websites', 'AI로 이력서 초안을 다듬는 웹서비스', '경력을 적으면 읽기 좋은 이력서 문장으로 정리해 줘요', '이력서 쓰는 게 막막할 때, 경력과 경험을 편하게 적기만 하세요. 읽기 좋은 문장으로 다듬어 이력서 초안을 만들어 드립니다.

• 직무별 이력서 문장 가이드 제공
• 성과 중심 표현으로 문장 다듬기
• 완성본은 PDF로 바로 저장
• 입력한 내용은 저장하지 않고 브라우저에서만 사용

첫 이력서도, 이직 준비도 부담 없이 시작해 보세요.', '/seed/06.svg', 'https://example.com/?from=thehongbo&p=6', null, null, null, null, array['이력서', 'AI', '취업', '이직']::text[], '{}'::jsonb, 'active', true, 4, true, now() - interval '2 minutes', now() - interval '2 minutes', now() - interval '2 minutes'),
  (7, 'websites', '무료 이미지 사이즈 변환 도구', '가입 없이, 업로드 없이. 브라우저에서 바로 크기 변환', '블로그, SNS, 쇼핑몰에 맞는 이미지 크기를 한 번에 맞춰주는 무료 도구입니다.

• 자주 쓰는 SNS·쇼핑몰 규격 프리셋 제공
• 여러 장을 한 번에 변환
• JPG / PNG / WebP 변환 지원
• 이미지는 서버로 올라가지 않고 내 브라우저에서만 처리

회원가입도 설치도 필요 없어요. 바로 열어서 쓰세요.', '/seed/07.svg', 'https://example.com/?from=thehongbo&p=7', null, null, null, null, array['이미지', '리사이즈', '무료도구', '웹도구']::text[], '{}'::jsonb, 'active', true, 7, true, now() - interval '20 minutes', now() - interval '20 minutes', now() - interval '20 minutes'),
  (8, 'websites', '링크 하나로 포트폴리오 만드는 페이지', '작업물 링크만 모으면 깔끔한 포트폴리오 페이지 완성', '디자이너, 개발자, 크리에이터를 위한 간단한 포트폴리오 페이지 메이커입니다.

• 작업물 링크와 썸네일을 붙여넣기만 하면 카드로 정리
• 나만의 주소로 공유 가능한 한 장짜리 페이지
• 모바일에서도 보기 좋은 반응형 레이아웃
• 코딩 없이 5분이면 완성

이력서에 넣을 링크 하나, 오늘 만들어 보세요.', '/seed/08.svg', 'https://example.com/?from=thehongbo&p=8', null, null, null, null, array['포트폴리오', '링크모음', '디자이너', '개발자']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '36 minutes', now() - interval '36 minutes', now() - interval '36 minutes'),
  (9, 'websites', '동네 행사 모아보는 웹사이트', '플리마켓, 전시, 공연… 이번 주말 우리 동네 행사 한눈에', '동네에서 열리는 작은 행사 소식을 한곳에 모아 보여주는 웹사이트입니다.

• 지역과 날짜로 간단하게 행사 찾기
• 플리마켓, 전시, 공연, 클래스 등 카테고리 분류
• 행사 주최자는 누구나 무료로 소식 등록 가능
• 주말 나들이 계획에 바로 쓰는 이번 주 추천

근처에서 열리는 재미있는 행사를 놓치지 마세요.', '/seed/09.svg', 'https://example.com/?from=thehongbo&p=9', null, null, null, null, array['행사', '플리마켓', '지역', '주말']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '52 minutes', now() - interval '52 minutes', now() - interval '52 minutes'),
  (10, 'websites', '간단 견적 요청 페이지 만들기', '고객이 항목만 고르면 견적 요청이 바로 도착해요', '프리랜서와 소규모 사업자를 위한 견적 요청 페이지 생성 도구입니다.

• 질문 항목을 골라 나만의 견적 폼 생성
• 공유 링크 하나로 고객 요청 받기
• 요청 내용은 이메일로 정리해서 전달
• 복잡한 기능 없이 필요한 것만 담은 단순한 구성

문의 주고받는 시간을 줄이고, 작업에 더 집중하세요.', '/seed/10.svg', 'https://example.com/?from=thehongbo&p=10', null, null, null, null, array['견적', '프리랜서', '폼', '소상공인']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '68 minutes', now() - interval '68 minutes', now() - interval '68 minutes'),
  (11, 'services', '소상공인 무료 첫 상담 (마케팅 컨설팅)', '우리 가게 홍보, 어디서부터 해야 할지 30분 상담해 드려요', '가게를 열었지만 홍보가 막막한 소상공인 사장님을 위한 무료 첫 상담입니다.

• 현재 사용 중인 홍보 채널 점검
• 예산 없이 시작할 수 있는 홍보 아이디어 제안
• 지역·업종에 맞는 우선순위 정리
• 상담 후 바로 실행할 체크리스트 제공

첫 30분 상담은 무료입니다. 편하게 신청해 주세요.', '/seed/11.svg', 'https://example.com/?from=thehongbo&p=11', null, null, null, null, array['마케팅', '컨설팅', '소상공인', '무료상담']::text[], '{"usageType":"online"}'::jsonb, 'active', true, 10, true, now() - interval '4 minutes', now() - interval '4 minutes', now() - interval '4 minutes'),
  (12, 'services', '1인 사업자 상세페이지 점검해 드려요', '내 상세페이지, 구매 버튼 누르기 전에 이탈하는 이유를 찾아요', '스마트스토어, 자사몰, 포트폴리오 상세페이지를 객관적인 눈으로 점검해 드립니다.

• 첫 화면 설득력, 구성 흐름, 문장 가독성 점검
• 모바일 화면 기준으로 불편한 지점 체크
• 개선 우선순위 3가지를 문서로 정리
• 점검 후 1회 재문의 가능

판매가 막혀 있다면 먼저 점검부터 받아보세요.', '/seed/12.svg', 'https://example.com/?from=thehongbo&p=12', null, null, null, null, array['상세페이지', '점검', '스마트스토어', '1인사업자']::text[], '{"usageType":"online"}'::jsonb, 'active', false, null, true, now() - interval '26 minutes', now() - interval '26 minutes', now() - interval '26 minutes'),
  (13, 'services', '온라인 문서 정리 대행', '흩어진 파일과 문서를 깔끔한 폴더 구조로 정리해 드려요', '쌓여 있는 파일, 사진, 문서를 원격으로 정리해 드립니다.

• 폴더 구조 설계부터 파일명 규칙 정리까지
• 중복 파일 정리와 백업 구조 제안
• 정리 후에도 유지하기 쉬운 간단한 사용 가이드
• 개인·소규모 팀 모두 가능

찾는 시간이 줄어들면 일하는 시간이 늘어납니다.', '/seed/13.svg', 'https://example.com/?from=thehongbo&p=13', null, null, null, null, array['문서정리', '대행', '파일관리', '원격']::text[], '{"usageType":"online"}'::jsonb, 'active', false, null, true, now() - interval '42 minutes', now() - interval '42 minutes', now() - interval '42 minutes'),
  (14, 'services', '영상 자막 정리 서비스', '받아쓰기 자막을 읽기 좋게 다듬고 타이밍까지 맞춰드려요', '유튜브, 강의, 인터뷰 영상의 자막을 보기 좋게 정리해 드립니다.

• 자동 생성 자막의 오타·띄어쓰기 교정
• 한 줄 길이와 줄바꿈 정리
• SRT 파일 또는 영상용 자막 형태로 전달
• 영상 길이에 따라 간단하게 견적 안내

영상은 잘 만들었는데 자막이 고민이라면 맡겨주세요.', '/seed/14.svg', 'https://example.com/?from=thehongbo&p=14', null, null, null, null, array['자막', '영상편집', '유튜브', '교정']::text[], '{"usageType":"online"}'::jsonb, 'active', false, null, true, now() - interval '58 minutes', now() - interval '58 minutes', now() - interval '58 minutes'),
  (15, 'services', '홈페이지 사용성 피드백', '처음 보는 사람의 눈으로 홈페이지를 둘러보고 피드백을 드려요', '내가 만든 홈페이지가 처음 방문한 사람에게 이해되는지 확인해 보세요.

• 첫 방문자 시선으로 둘러본 과정을 정리
• 헷갈리는 메뉴, 놓치기 쉬운 버튼 짚어드리기
• 모바일·PC 각각 확인
• 개선하면 좋은 점을 짧은 문서로 전달

오픈 전 점검이나 리뉴얼 전 의견이 필요할 때 추천해요.', '/seed/15.svg', 'https://example.com/?from=thehongbo&p=15', null, null, null, null, array['UX', '피드백', '홈페이지', '사용성']::text[], '{"usageType":"online"}'::jsonb, 'active', false, null, true, now() - interval '74 minutes', now() - interval '74 minutes', now() - interval '74 minutes'),
  (16, 'offline', '울산 삼산동 감성 카페 ‘한잔의 오후’', '직접 로스팅한 원두와 라떼아트가 있는 조용한 동네 카페', '삼산동 골목 안쪽, 햇빛이 잘 드는 작은 카페입니다.

• 매주 로스팅하는 싱글오리진 원두
• 라떼아트가 예쁜 시그니처 라떼
• 노트북 작업하기 좋은 콘센트 좌석
• 반려견 동반 가능한 테라스 자리

따뜻한 한 잔과 함께 여유로운 오후를 보내고 가세요.', '/seed/16.svg', 'https://example.com/?from=thehongbo&p=16', null, null, '울산', '울산 남구 삼산동 일대', array['카페', '커피', '로스팅', '삼산동']::text[], '{}'::jsonb, 'active', true, 2, true, now() - interval '16 minutes', now() - interval '16 minutes', now() - interval '16 minutes'),
  (17, 'offline', '부산 서면 수제버거 가게 ‘버거홀릭’', '두툼한 패티와 직접 만든 소스, 서면에서 즐기는 수제버거', '주문 즉시 구워내는 두툼한 수제 패티가 자랑인 서면의 버거 가게입니다.

• 100% 소고기 패티, 매일 아침 굽는 번
• 직접 만든 시그니처 소스
• 감자튀김과 수제 레몬에이드 세트 구성
• 혼밥 환영, 포장 가능

퇴근길 든든한 한 끼가 필요할 때 들러보세요.', '/seed/17.svg', 'https://example.com/?from=thehongbo&p=17', null, null, '부산', '부산 부산진구 서면 일대', array['수제버거', '서면', '맛집', '혼밥']::text[], '{}'::jsonb, 'active', true, 6, true, now() - interval '10 minutes', now() - interval '10 minutes', now() - interval '10 minutes'),
  (18, 'offline', '서울 성수 소형 공방 원데이 클래스', '도자기·가죽 소품을 직접 만들어보는 작은 공방', '성수동 골목의 작은 공방에서 원데이 클래스를 진행합니다.

• 도자기 컵·접시, 가죽 카드지갑 클래스
• 소규모 정원제로 천천히 알려드려요
• 완성품은 포장해서 가져가기
• 선물용·데이트 코스로 인기

손으로 만드는 시간의 즐거움을 경험해 보세요.', '/seed/18.svg', 'https://example.com/?from=thehongbo&p=18', null, null, '서울', '서울 성동구 성수동 일대', array['공방', '원데이클래스', '성수', '도자기']::text[], '{}'::jsonb, 'active', true, 9, true, now() - interval '32 minutes', now() - interval '32 minutes', now() - interval '32 minutes'),
  (19, 'offline', '대전 1:1 PT 스튜디오', '처음 운동하는 분도 편안한 소규모 1:1 맞춤 PT', '운동이 처음이어도 부담 없이 시작할 수 있는 소규모 PT 스튜디오입니다.

• 체형·목표에 맞춘 1:1 맞춤 프로그램
• 한 타임 한 명, 프라이빗한 공간
• 자세 교정과 기초 체력 중심 수업
• 첫 상담 및 체험 문의 가능

꾸준히 이어갈 수 있는 운동 습관을 함께 만들어 드립니다.', '/seed/19.svg', 'https://example.com/?from=thehongbo&p=19', null, null, '대전', '대전 서구 둔산동 일대', array['PT', '헬스', '다이어트', '운동']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '48 minutes', now() - interval '48 minutes', now() - interval '48 minutes'),
  (20, 'offline', '대구 예약제 미용실', '예약한 분께만 집중하는 조용한 1인 헤어 살롱', '한 번에 한 분만 시술하는 예약제 1인 미용실입니다.

• 상담에 충분한 시간을 쓰는 맞춤 스타일링
• 커트, 펌, 염색, 클리닉 가능
• 예약 시간에 맞춰 대기 없이 진행
• 조용하고 편안한 분위기

내 머릿결과 얼굴형에 어울리는 스타일을 찾아드릴게요.', '/seed/20.svg', 'https://example.com/?from=thehongbo&p=20', null, null, '대구', '대구 중구 동성로 일대', array['미용실', '헤어', '예약제', '대구']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '64 minutes', now() - interval '64 minutes', now() - interval '64 minutes'),
  (21, 'products', '데스크 정리용 미니 수납함', '작은 책상도 깔끔하게. 펜·케이블·메모를 한 번에 정리', '좁은 책상 위를 단정하게 만들어주는 미니 수납함입니다.

• 칸막이 4개로 펜, 메모, 케이블, 소품 분리 수납
• 겹쳐 쌓을 수 있는 모듈 구조
• 매트한 질감, 어떤 책상에도 어울리는 컬러
• 가볍고 튼튼한 소재

정리된 책상에서 집중력도 함께 올라갑니다.', '/seed/21.svg', 'https://example.com/?from=thehongbo&p=21', null, '12,900원', null, null, array['수납', '데스크테리어', '정리', '문구']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '6 minutes', now() - interval '6 minutes', now() - interval '6 minutes'),
  (22, 'products', '프리미엄 무선 이어폰 파우치', '스크래치 걱정 없이 이어폰과 케이블을 한 번에 보관', '무선 이어폰과 충전 케이블을 함께 넣을 수 있는 슬림 파우치입니다.

• 부드러운 안감으로 스크래치 방지
• 케이블 보관용 메쉬 포켓
• 가방 안에서도 부피를 적게 차지하는 슬림 디자인
• 선물용으로도 좋은 깔끔한 컬러

매일 들고 다니는 물건이니 예쁘고 튼튼한 걸로 챙기세요.', '/seed/22.svg', 'https://example.com/?from=thehongbo&p=22', null, '19,800원', null, null, array['이어폰', '파우치', '악세사리', '선물']::text[], '{}'::jsonb, 'active', true, 3, true, now() - interval '22 minutes', now() - interval '22 minutes', now() - interval '22 minutes'),
  (23, 'products', '캠핑용 경량 랜턴', '손바닥만 한 크기, 밝기 3단계 조절 충전식 랜턴', '백패킹과 차박에 어울리는 경량 충전식 랜턴입니다.

• 약 100g의 가벼운 무게
• 밝기 3단계, 따뜻한 색감의 조명
• USB 충전식, 걸어두는 고리 포함
• 비 오는 날에도 안심인 생활 방수 설계

캠핑장의 밤을 포근하게 밝혀주는 작은 랜턴입니다.', '/seed/23.svg', 'https://example.com/?from=thehongbo&p=23', null, '24,900원', null, null, array['캠핑', '랜턴', '백패킹', '차박']::text[], '{}'::jsonb, 'active', true, 12, true, now() - interval '38 minutes', now() - interval '38 minutes', now() - interval '38 minutes'),
  (24, 'products', '직접 만든 캐릭터 스티커 세트', '다이어리·노트북·폰케이스를 꾸미는 손그림 캐릭터 스티커', '직접 그린 캐릭터를 스티커로 만들었습니다.

• 방수 코팅 스티커 30매 구성
• 다이어리, 노트북, 텀블러 어디에든 붙이기 좋아요
• 잘 떼지고 흔적이 남지 않는 접착
• 소량 제작으로 정성껏 포장해 보내드려요

일상에 작은 즐거움을 붙여보세요.', '/seed/24.svg', 'https://example.com/?from=thehongbo&p=24', null, '6,500원', null, null, array['스티커', '다꾸', '핸드메이드', '캐릭터']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '54 minutes', now() - interval '54 minutes', now() - interval '54 minutes'),
  (25, 'products', '원두 드립백 세트 (10개입)', '뜨거운 물만 부으면 완성되는 향 좋은 스페셜티 드립백', '집에서도 사무실에서도 간편하게 즐기는 드립백 커피 세트입니다.

• 로스팅 후 바로 소분한 신선한 원두
• 산미와 단맛의 밸런스를 맞춘 블렌드
• 개별 포장으로 휴대하기 편한 10개입
• 선물 포장 가능

바쁜 아침에도 한 잔의 여유를 챙겨보세요.', '/seed/25.svg', 'https://example.com/?from=thehongbo&p=25', null, '9,900원', null, null, array['드립백', '커피', '원두', '선물']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '70 minutes', now() - interval '70 minutes', now() - interval '70 minutes'),
  (26, 'content', '퇴근 후 1분 생활팁 쇼츠 채널', '청소·정리·요리, 1분이면 따라 하는 생활 꿀팁 모음', '퇴근하고 지친 저녁에도 1분이면 볼 수 있는 생활팁 쇼츠 채널입니다.

• 청소, 정리, 간단 요리 등 생활 속 꿀팁
• 군더더기 없이 핵심만 짧게
• 매주 새로운 영상 업로드
• 구독하고 알림 설정하면 놓치지 않아요

하루에 하나씩, 생활이 조금씩 편해집니다.', '/seed/26.svg', 'https://example.com/?from=thehongbo&p=26', 'youtube', null, null, null, array['쇼츠', '생활팁', '유튜브', '꿀팁']::text[], '{}'::jsonb, 'active', true, 8, true, now() - interval '8 minutes', now() - interval '8 minutes', now() - interval '8 minutes'),
  (27, 'content', '직장인 개발 기록 블로그', '일하면서 배운 개발 지식과 시행착오를 솔직하게 기록해요', '현업 개발자가 일하면서 배운 것들을 차곡차곡 기록하는 블로그입니다.

• 실무에서 마주친 문제와 해결 과정
• 처음 배우는 분들을 위한 쉬운 설명
• 사이드 프로젝트 회고
• 이직·커리어 이야기

같은 고민을 하는 분들께 도움이 되면 좋겠습니다.', '/seed/27.svg', 'https://example.com/?from=thehongbo&p=27', 'blog', null, null, null, array['개발', '블로그', '개발자', '기록']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '24 minutes', now() - interval '24 minutes', now() - interval '24 minutes'),
  (28, 'content', '혼밥 맛집 기록 인스타그램', '혼자 가도 편한 식당만 모았어요. 1인분 메뉴 위주 기록', '혼자 먹어도 어색하지 않은 식당만 골라 기록하는 계정입니다.

• 1인석, 바 좌석이 있는 곳 위주
• 메뉴 가격과 분위기를 솔직하게
• 지역별로 정리한 하이라이트
• 같이 가볼 만한 근처 장소도 함께

혼밥 장소 고민될 때 구경하러 오세요.', '/seed/28.svg', 'https://example.com/?from=thehongbo&p=28', 'instagram', null, null, null, array['혼밥', '맛집', '인스타그램', '기록']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '40 minutes', now() - interval '40 minutes', now() - interval '40 minutes'),
  (29, 'content', '매일 한 문장 영어 계정', '하루 한 문장, 쉬운 영어 표현을 짧게 알려드려요', '부담 없이 매일 한 문장씩 익히는 영어 표현 계정입니다.

• 실생활에서 바로 쓰는 쉬운 표현
• 발음과 뉘앙스 설명을 짧게
• 주말엔 한 주 복습 카드
• 팔로우하면 피드에서 자연스럽게 학습

작은 문장이 쌓이면 어느새 영어가 편해집니다.', '/seed/29.svg', 'https://example.com/?from=thehongbo&p=29', 'threads', null, null, null, array['영어', '영어공부', '하루한문장', '학습']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '56 minutes', now() - interval '56 minutes', now() - interval '56 minutes'),
  (30, 'content', 'AI 도구 사용기 채널', '새로 나온 AI 도구를 직접 써보고 솔직하게 정리해요', '새로 나온 AI 도구들을 직접 써보고 장단점을 솔직하게 정리하는 채널입니다.

• 실제 업무·일상에서 써본 후기 위주
• 무료로 쓸 수 있는 도구 우선 소개
• 초보자도 따라 할 수 있는 활용법
• 도구별 비교 정리

AI 도구 고르기가 어려울 때 참고해 보세요.', '/seed/30.svg', 'https://example.com/?from=thehongbo&p=30', 'youtube', null, null, null, array['AI', '도구', '리뷰', '유튜브']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '72 minutes', now() - interval '72 minutes', now() - interval '72 minutes'),
  (31, 'events', '신규 앱 베타테스터 모집', '출시 전 앱을 먼저 써보고 의견을 나눠주실 분을 찾아요', '출시를 앞둔 앱의 베타테스터를 모집합니다.

• 앱을 먼저 써보고 불편한 점을 알려주세요
• 간단한 설문 1회와 사용 후기 요청
• Android 사용자 우선 모집
• 참여해 주신 분은 정식 출시 소식을 가장 먼저 안내

작은 의견이 앱을 더 좋게 만듭니다.', '/seed/31.svg', 'https://example.com/?from=thehongbo&p=31', null, null, null, null, array['베타테스터', '앱', '모집', '테스트']::text[], '{"period":"상시 모집"}'::jsonb, 'active', true, 11, true, now() - interval '18 minutes', now() - interval '18 minutes', now() - interval '18 minutes'),
  (32, 'events', '동네 플리마켓 셀러 모집', '핸드메이드·빈티지·중고 셀러를 모집합니다', '정기적으로 열리는 동네 플리마켓에서 함께할 셀러를 모집합니다.

• 핸드메이드, 빈티지, 중고 물품 모두 가능
• 소규모 부스 단위 신청
• 푸드 셀러는 사전 문의
• 신청 링크에서 참가 안내 확인

작은 가게를 시작해 보고 싶은 분들도 환영합니다.', '/seed/32.svg', 'https://example.com/?from=thehongbo&p=32', null, null, '경기', null, array['플리마켓', '셀러', '모집', '핸드메이드']::text[], '{"period":"매월 1회 정기 개최"}'::jsonb, 'active', false, null, true, now() - interval '34 minutes', now() - interval '34 minutes', now() - interval '34 minutes'),
  (33, 'events', '온라인 스터디 멤버 모집', '주 2회 온라인으로 함께 공부할 스터디 멤버를 찾아요', '혼자서는 꾸준히 하기 어려운 공부, 같이 해봐요.

• 주 2회 온라인 모임 (1시간)
• 각자 목표를 공유하고 진행 상황 체크
• 편안한 분위기, 부담 없는 참여
• 직장인·학생 모두 환영

신청 링크에서 간단한 소개만 남겨주세요.', '/seed/33.svg', 'https://example.com/?from=thehongbo&p=33', null, null, null, null, array['스터디', '온라인', '모집', '자기계발']::text[], '{"period":"자리가 찰 때까지"}'::jsonb, 'active', false, null, true, now() - interval '50 minutes', now() - interval '50 minutes', now() - interval '50 minutes'),
  (34, 'events', '서비스 사용성 인터뷰 참가자 모집', '30분 온라인 인터뷰로 서비스 개선에 의견을 보태주세요', '개선 중인 서비스에 대해 의견을 들려주실 인터뷰 참가자를 모집합니다.

• 온라인(화상) 30분 진행
• 편한 시간대를 선택해 신청
• 질문은 사용 경험 중심, 정답은 없어요
• 참여해 주신 분께 소정의 감사 인사를 준비 중

솔직한 이야기가 가장 큰 도움이 됩니다.', '/seed/34.svg', 'https://example.com/?from=thehongbo&p=34', null, null, null, null, array['인터뷰', '사용성', '모집', 'UX']::text[], '{"period":"상시 모집"}'::jsonb, 'active', false, null, true, now() - interval '66 minutes', now() - interval '66 minutes', now() - interval '66 minutes'),
  (35, 'free', '개인 포트폴리오 구경해주세요', '디자인과 개발 작업물을 모아둔 제 포트폴리오입니다', '그동안 만든 디자인과 개발 작업물을 한곳에 모았습니다.

• 웹/앱 UI 작업
• 브랜딩과 로고 작업
• 사이드 프로젝트 기록

편하게 둘러보시고 의견 주시면 큰 힘이 됩니다.', '/seed/35.svg', 'https://example.com/?from=thehongbo&p=35', null, null, null, null, array['포트폴리오', '디자인', '개발', '작업물']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '12 minutes', now() - interval '12 minutes', now() - interval '12 minutes'),
  (36, 'free', '새로 만든 뉴스레터를 소개합니다', '매주 한 번, 일상 속 작은 영감을 메일로 보내드려요', '일상에서 발견한 작은 영감과 읽을거리를 매주 한 번 정리해 보내는 뉴스레터입니다.

• 주 1회, 5분이면 읽는 분량
• 책, 영상, 생각 정리
• 구독은 무료, 언제든 해지 가능

가볍게 구독해 보세요.', '/seed/36.svg', 'https://example.com/?from=thehongbo&p=36', null, null, null, null, array['뉴스레터', '구독', '영감', '읽을거리']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '28 minutes', now() - interval '28 minutes', now() - interval '28 minutes'),
  (37, 'free', '팀 프로젝트 멤버를 찾습니다', '사이드 프로젝트를 함께 만들어갈 기획·디자인·개발 팀원 모집', '작은 서비스를 같이 만들어갈 팀원을 찾고 있습니다.

• 기획, 디자인, 프론트엔드, 백엔드 모두 환영
• 주 1~2회 가벼운 온라인 미팅
• 아이디어 단계부터 함께 이야기해요

관심 있으신 분은 링크에서 편하게 연락 주세요.', '/seed/37.svg', 'https://example.com/?from=thehongbo&p=37', null, null, null, null, array['팀원모집', '사이드프로젝트', '협업', '스타트업']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '44 minutes', now() - interval '44 minutes', now() - interval '44 minutes'),
  (38, 'free', '작은 브랜드 첫 오픈 소식', '작게 시작하는 우리 브랜드, 첫 인사를 드립니다', '오랜 준비 끝에 작은 브랜드를 열었습니다.

• 정성껏 만든 제품을 소량씩 선보여요
• 브랜드 이야기와 첫 제품은 링크에서 확인
• 오픈 기념 소식은 가장 먼저 알려드릴게요

따뜻한 관심 부탁드립니다.', '/seed/38.svg', 'https://example.com/?from=thehongbo&p=38', null, null, null, null, array['신규오픈', '브랜드', '오픈소식', '소규모']::text[], '{}'::jsonb, 'active', false, null, true, now() - interval '60 minutes', now() - interval '60 minutes', now() - interval '60 minutes')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.posts', 'id'), greatest((select max(id) from public.posts), 1000));

do $$
begin
  if not exists (select 1 from public.banners) then
    insert into public.banners (title, subtitle, image_url, target_url, placement, theme, sort_order, is_active) values
    ('뭐든 홍보하세요. 등록은 무료!', '앱·가게·상품·콘텐츠 무엇이든 1분이면 등록', null, '/write', 'side', 'coral', 1, true),
    ('새로운 홍보를 매일 발견하세요.', '방금 올라온 홍보글 보러가기', null, '/posts?sort=latest', 'side', 'amber', 2, true),
    ('앱 만들었는데 알릴 곳이 없다면?', '설치 링크와 함께 앱·게임 홍보', null, '/category/apps', 'strip', 'blue', 1, true),
    ('우리 가게, 동네 사람들에게 알려보세요.', '카페·음식점·공방 오프라인 가게 홍보', null, '/category/offline', 'strip', 'mint', 2, true),
    ('상품·서비스·콘텐츠까지 한 번에', '카테고리 제한 없이 모든 홍보를 한곳에서', null, '/posts', 'strip', 'violet', 3, true);
  end if;
  if not exists (select 1 from public.notices) then
    insert into public.notices (title, body, is_pinned, published_at) values
    ('더홍보 오픈 안내', '누구나 무료로 앱·사이트·가게·상품·서비스를 홍보할 수 있는 더홍보가 문을 열었습니다. 로그인 후 1분이면 홍보글을 올릴 수 있어요.', true, now() - interval '0 hours'),
    ('홍보글 작성 시 꼭 확인해주세요', '제목과 한 줄 소개는 짧고 분명하게, 대표 이미지는 1장 이상 등록하면 더 눈에 잘 띕니다. 링크는 http 또는 https 주소만 사용할 수 있어요.', false, now() - interval '12 hours'),
    ('불법·사기·성인·도배 홍보는 삭제될 수 있습니다', '불법 상품·서비스, 사기·피싱, 성인·불법 도박, 타인 사칭, 반복 도배 홍보는 사전 안내 없이 숨김 또는 삭제될 수 있습니다. 자세한 내용은 운영정책을 확인해주세요.', false, now() - interval '24 hours'),
    ('외부 링크 이용 시 거래 조건을 직접 확인해주세요', '더홍보는 홍보 공간을 제공하는 플랫폼이며 거래의 당사자가 아닙니다. 외부 사이트에서의 구매·계약·결제는 각 판매자의 조건을 직접 확인한 뒤 진행해주세요.', false, now() - interval '36 hours');
  end if;
end $$;

commit;
