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
export function promoHashtags(post = {}, seed = post.post_id ?? 0) {
  // Only inspect the actual public source; never derive arbitrary tags from AI or user hashtags.
  const source = [post.title, post.short_description, post.description].join(' ').normalize('NFKC');
  const relevant = [...new Set(TOPICS.filter(([pattern]) => pattern.test(source)).flatMap(([, tags]) => tags))];
  const contextual = shuffled(relevant, `${seed}:topic`).slice(0, 3);
  const common = shuffled(COMMON_HASHTAGS.filter(tag => !contextual.includes(tag)), seed).slice(0, 4);
  return ['더홍보', ...common, ...contextual].map(tag => `#${tag}`);
}
