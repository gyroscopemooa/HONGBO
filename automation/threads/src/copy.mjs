// Standalone Cloudflare Worker, intentionally not imported by the Next.js site.
// Default AUTOPOST_ENABLED=false prevents publication without explicit setup.

const MAX_THREADS_CHARS = 430; // conservative headroom vs Threads' 500-char limit, including emoji


function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}
function cleanedPublicExcerpt(value) {
  // Do not amplify private contact details or arbitrary third-party links from user-generated copy.
  return clean(value)
    .replace(/https?:\/\/[^\s]+/gi, "[원문 링크에서 확인]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[연락처는 원문 참고]")
    .replace(/(?:\+?82[- ]?0?|0)1[016789][- ]?\d{3,4}[- ]?\d{4}/g, "[연락처는 원문 참고]");
}
export function weightedLength(value) {
  // Threads counts complex emoji more heavily than ordinary text. This is conservative.
  let count = 0;
  for (const c of String(value ?? "")) {
    count += (/\p{Emoji}|\p{Emoji_Component}/u.test(c))
      ? new TextEncoder().encode(c).length : 1;
  }
  return count;
}
function clipped(value, max) {
  if (max <= 0) return "";
  const chars = Array.from(clean(value));
  let out = "";
  for (const c of chars) {
    if (weightedLength(out + c) > max) return Array.from(out).slice(0, -1).join("") + "…";
    out += c;
  }
  return out;
}
function joinUrl(base, postId) {
  return base.replace(/\/+$/, "") + "/post/" + encodeURIComponent(String(postId));
}

// A warm, slightly cheeky official account voice. Factual promotion always goes first.
// Select by post ID so retrying does not unexpectedly change the copy.
const OPENERS = [
  "오늘의 홍보글 도착했습니다. 일단 제가 먼저 소문내겠습니다.",
  "오늘 소개할 서비스 도착했습니다. 홍보 담당자 바로 출동합니다.",
  "오늘도 서비스 홍보 갑니데이~",
  "구경은 여러분이, 홍보는 제가. 오늘의 소개 시작합니다.",
  "홍보 담당자 출근했습니다. 오늘 소개할 소식부터 꺼내봅니다.",
  "알릴 소식이 있어 왔습니다. 이번에도 본론부터 갑니다.",
  "오늘의 홍보 배달 왔습니다. 자세한 이야기는 원문에 있습니다.",
  "잠깐 소개하고 가겠습니다. 홍보 담당자의 본업 시간입니다.",
];
const FRESH_OPENERS = [
  "새 홍보글 하나 올라왔네요. 바로 홍보 갑니다.",
  "이번에 새로운 홍보글이 도착했습니다. 담당자 바로 출동합니다.",
  "방금 확인한 새 글입니다. 소식 식기 전에 소개합니다.",
  "새 글 올라왔네요. 오늘도 홍보할 일이 생겼습니다.",
];
const SIGNOFFS = [
  "오늘도 홍보를 홍보하는 중입니다. 직업 설명이 점점 어려워지네요.",
  "좋은 소개는 원문에, 알리는 일은 저에게 맡겨주세요.",
  "저를 홍보해 주실 분도 구합니다. 아, 여긴 제가 홍보하는 곳이죠.",
  "홍보가 필요한 곳에 제가 갑니다. 퇴근길만 아직 못 찾았어요.",
  "이 글을 홍보하는 저를 홍보할 사람도 필요하겠네요.",
  "광고냐고요? 맞습니다. 근데 꽤 열심히 하고 있죠.",
  "홍보하러 왔다가 홍보하고 갑니다. 다음 소식에도 나타납니다.",
  "더홍보 소식 배달 완료. 오늘도 열일하는 홍보 담당자 올림.",
  "오늘도 누군가의 서비스를 알리는 중. 제 존재감도 덤으로 알립니다.",
  "홍보를 위한 홍보를 하는 홍보 계정입니다. 네, 설명이 길어졌네요.",
  "소개는 여기까지, 구경은 원문에서 이어집니다. 저는 다음 홍보를 준비합니다.",
  "서비스는 주인공, 저는 안내 담당입니다. 제 분량은 이 정도면 됐죠.",
  "알릴 곳이 필요한 소식, 오늘도 더홍보에서 가져왔습니다.",
  "소문내는 것도 일이라면 저는 지금 아주 성실하게 근무 중입니다.",
  "홍보 담당자의 할 일 하나 완료. 원문 구경은 여러분 차례입니다.",
  "오늘의 소개를 마칩니다. 더홍보의 홍보 담당자는 또 돌아옵니다.",
];

export function formatPromo(post, siteUrl, suggestedBody = "", context = {}) {
  const id = Number(post.post_id) || 0;
  const link = joinUrl(siteUrl, post.post_id);
  // Freshness requires an explicit current source timestamp, never a bump timestamp.
  const published = Date.parse(post.published_at ?? '');
  const now = context.now ?? Date.now();
  const fresh = Number.isFinite(published) && now >= published && now - published <= 86400000;
  const pool = fresh ? FRESH_OPENERS : OPENERS;
  const opener = id % 5 === 0
    ? pool[Math.abs(Math.floor(id / 5)) % pool.length] + "\n\n"
    : "";
  const title = "" + clipped(cleanedPublicExcerpt(post.title), 120) + "\n\n";
  const closer = "\n\n원문 보기: " + link +
    "\n\n" + SIGNOFFS[Math.abs(id) % SIGNOFFS.length] +
    "\n무료 홍보는 더홍보에서! #더홍보";
  const room = Math.max(0, MAX_THREADS_CHARS - weightedLength(opener + title + closer));
  const source = cleanedPublicExcerpt(post.short_description) || cleanedPublicExcerpt(post.description) || "새로운 홍보 소식이 등록됐어요.";
  // Original source wins; AI is a supplementary, short social-friendly teaser.
  const sourceText = clipped(source, Math.min(230, room));
  const ai = cleanedPublicExcerpt(suggestedBody);
  const remaining = room - weightedLength(sourceText) - (ai ? 2 : 0);
  const teaser = remaining > 12 && ai && ai !== sourceText
    ? "\n\n" + clipped(ai, Math.min(100, remaining))
    : "";
  return opener + title + sourceText + teaser + closer;
}
