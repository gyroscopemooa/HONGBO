// Curated plain-text hashtags, not Threads topic tags. No AI/API calls.
export const COMMON_HASHTAGS = [
  '홍보', '온라인홍보', '서비스홍보', '홍보글', '홍보공간', '홍보소식',
  '홍보이야기', '홍보하는중', '홍보담당자', '홍보타임', '홍보한스푼',
  '소개합니다', '알려드립니다', '소식공유', '정보공유', '서비스소개',
  '서비스발견', '서비스소식', '서비스구경', '함께알려요', '함께둘러봐요',
  '구경오세요', '한번둘러보세요', '오늘의소개', '오늘의소식', '오늘의발견',
  '소개하는중', '소문내는중', '알리는중', '발견하는재미', '더홍보소식', '더홍보이야기',
];
const TOPICS = [
  [/운동일지|헬띠루틴|운동\s*앱|헬스\s*루틴/u, ['운동앱', '운동일지', '루틴관리', '운동기록', '헬스루틴']],
  [/1인\s*개발|일인\s*개발/u, ['1인개발', '개인개발']],
  [/인디\s*게임/u, ['인디게임', '게임소개', '게임개발']],
  [/카페|커피/u, ['카페', '카페소개']],
  [/음식점|식당/u, ['식당소개', '가게소개']],
  [/번역|통역/u, ['번역', '언어서비스']],
  [/자막/u, ['자막', '영상자막']],
  [/스트리밍|라이브\s*방송/u, ['스트리밍', '라이브방송']],
  [/인공지능|\bAI\b/iu, ['AI', '인공지능']],
  [/웹사이트|웹\s*서비스/u, ['웹서비스', '웹사이트소개']],
  [/앱|어플|애플리케이션/u, ['앱소개', '모바일앱']],
  [/디자인/u, ['디자인', '디자인서비스']],
  [/교육|강의|학습/u, ['교육', '학습']],
  [/운동|피트니스/u, ['운동', '피트니스']],
  [/여행/u, ['여행', '여행정보']],
  [/반려동물|반려견|반려묘/u, ['반려동물', '반려생활']],
];
function shuffled(values, seed) {
  let state = 2166136261;
  for (const c of String(seed)) state = Math.imul(state ^ c.codePointAt(0), 16777619) >>> 0;
  return values.map(value => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return { value, rank: state };
  }).sort((a, b) => a.rank - b.rank).map(x => x.value);
}
// Threads uses the FIRST hashtag as the post's topic tag, so pick it by content, not always the brand.
const CATEGORY_TOPICS = [
  ['이벤트', /이벤트|경품|추첨|증정|당첨|기프티콘|쿠폰|할인\s*행사/u],
  ['판매', /판매|쇼핑몰|스토어|상품|구매|공구|공동구매|특가|배송/u],
  ['개발', /개발|앱|어플|애플리케이션|게임|코딩|오픈소스|API|AI|인공지능|웹사이트|웹\s*서비스|SaaS/iu],
  ['마케팅', /마케팅|SNS|블로그|인스타|유튜브|브랜딩|콘텐츠|SEO|검색\s*노출/iu],
  ['광고', /광고|배너|홍보\s*대행|노출/u],
  ['맛집', /카페|커피|음식점|식당|맛집|베이커리/u],
  ['부업', /부업|투잡|수익화|N잡|재택근무/u],
  ['창업', /창업|스타트업|사업자|소상공인|프랜차이즈/u],
  ['재테크', /재테크|투자|주식|적금|절약|가계부/u],
  ['부동산', /부동산|인테리어|이사|전세|월세|분양/u],
  ['취업', /취업|채용|구직|이직|면접|자소서/u],
  ['교육', /교육|강의|학습|클래스|과외|스터디|공부/u],
  ['여행', /여행|숙소|관광|축제|캠핑|호텔/u],
  ['뷰티', /뷰티|화장품|스킨케어|메이크업|네일|헤어|피부/u],
  ['패션', /패션|의류|코디|옷|쥬얼리|액세서리/u],
  ['운동', /운동|헬스|피트니스|요가|필라테스|러닝|다이어트/u],
  ['건강', /건강|영양제|병원|한의원|건강식품/u],
  ['육아', /육아|아기|유아|임신|키즈|아이와/u],
  ['반려동물', /반려동물|반려견|반려묘|강아지|고양이/u],
  ['영화', /영화|드라마|웹툰|애니|OTT/iu],
  ['음악', /음악|노래|밴드|공연|콘서트|작곡/u],
  ['사진', /사진|촬영|영상\s*제작|스냅|포토/u],
  ['디자인', /디자인|로고|일러스트|인테리어소품/u],
  ['자동차', /자동차|중고차|차량|세차|튜닝/u],
  ['독서', /독서|책|도서|전자책|출판/u],
];
export function topicTag(post = {}) {
  const source = [post.title, post.short_description, post.description].join(' ').normalize('NFKC');
  return CATEGORY_TOPICS.find(([, pattern]) => pattern.test(source))?.[0] ?? '홍보';
}
export function promoHashtags(post = {}, seed = post.post_id ?? 0) {
  // Only inspect the actual public source; never derive arbitrary tags from AI or user hashtags.
  const source = [post.title, post.short_description, post.description].join(' ').normalize('NFKC');
  const relevant = [...new Set(TOPICS.filter(([pattern]) => pattern.test(source)).flatMap(([, tags]) => tags))];
  const contextual = shuffled(relevant, `${seed}:topic`).slice(0, 3);
  const topic = topicTag(post);
  const common = shuffled(COMMON_HASHTAGS.filter(tag => !contextual.includes(tag) && tag !== topic), seed).slice(0, 3);
  const rest = ['더홍보', ...common, ...contextual].filter(tag => tag !== topic);
  return [topic, ...rest].map(tag => `#${tag}`);
}
