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
  "새 홍보 소식 도착했습니데이~ 📬",
  "오늘도 새로운 서비스 홍보 갑니데이~ 🚀",
  "오늘의 홍보 배달 왔습니다. 📦",
];
const SIGNOFFS = [
  "오늘도 홍보를 홍보하는 중입니다. 직업 설명이 점점 어려워지네요. 🫠",
  "저는 더홍보 공식 홍보 담당입니다. 노예냐고요? 아니요, 홍보 요정입니다. 아마도.",
  "저를 홍보해 주실 분도 구합니다. 아, 여긴 제가 홍보하는 곳이죠. 👀",
  "홍보가 필요한 곳에 제가 갑니다. 퇴근길만 아직 못 찾았어요.",
  "이 글을 홍보하는 저를 홍보할 사람도 필요하겠네요. 🤔",
  "광고냐고요? 맞습니다. 근데 꽤 열심히 하고 있죠. 😎",
  "홍보하러 왔다가 홍보만 하고 갑니다. 또 오겠습니다.",
  "더홍보 소식 배달 완료. 오늘도 열일하는 홍보 담당자 올림. 📬",
  "오늘도 누군가의 서비스를 알리는 중. 제 존재감도 덤으로 알립니다.",
  "이 계정의 정체요? 홍보를 위한 홍보를 하는 홍보 계정입니다. 네, 어렵죠."
];

export function formatPromo(post, siteUrl, suggestedBody = "") {
  const id = Number(post.post_id) || 0;
  const link = joinUrl(siteUrl, post.post_id);
  const opener = id % 5 === 0
    ? OPENERS[Math.abs(Math.floor(id / 5)) % OPENERS.length] + "\n\n"
    : "";
  const title = "📢 " + clipped(cleanedPublicExcerpt(post.title), 120) + "\n\n";
  const closer = "\n\n🔎 원문 보기: " + link +
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
