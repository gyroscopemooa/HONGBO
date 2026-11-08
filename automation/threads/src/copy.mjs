// Standalone Cloudflare Worker, intentionally not imported by the Next.js site.
// Default AUTOPOST_ENABLED=false prevents publication without explicit setup.

import { promoHashtags } from './hashtags.mjs';
import { promoQuestion } from './questions.mjs';
const MAX_THREADS_CHARS = 430; // Reserve remaining space for optional hashtags.

export function appendPromoHashtags(text, post, seed, maxLength = 500) {
  let result = text;
  for (const tag of promoHashtags(post, seed)) {
    const next = result + (result === text ? '\n\n' : ' ') + tag;
    if (weightedLength(next) <= maxLength) result = next;
  }
  return result;
}


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
function destination(post, siteUrl) {
  try {
    const url = new URL(post.external_url);
    if (url.protocol === 'https:' && !url.username && !url.password && weightedLength(url.href) <= 120) return url.href;
  } catch { /* Missing or invalid destination falls back to the public source. */ }
  return joinUrl(siteUrl, post.post_id);
}

// A warm, slightly cheeky official account voice. Factual promotion always goes first.
// Select by post ID so retrying does not unexpectedly change the copy.
const OPENERS = [
  "더홍보에서 알려드립니다.",
  "더홍보에서 홍보글을 안내드립니다.",
  "더홍보에 올라온 광고글을 소개합니다.",
  "더홍보가 전해드리는 홍보 소식입니다.",
  "더홍보에서 소개할 소식을 가져왔습니다.",
  "더홍보에서 대신 알립니다. 이번 홍보글을 만나보세요.",
  "더홍보의 홍보글 안내 시간입니다.",
  "더홍보에 등록된 소식, 여기서도 소개해드립니다.",
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
  "더홍보에서 최신 홍보글을 안내드립니다.",
  "더홍보에 올라온 최신 광고글입니다.",
  "더홍보에서 새로 등록된 홍보글을 알려드립니다.",
  "더홍보가 새 홍보 소식을 전해드립니다.",
  "더홍보에 새 글이 올라왔습니다. 대신 소개해드릴게요.",
  "더홍보에서 새로운 광고 소식을 안내합니다.",
  "새로 올라온 홍보글, 더홍보가 소문내드립니다.",
  "더홍보의 새 소식 안내입니다. 원문도 함께 확인해보세요.",
  "새 홍보글 하나 올라왔네요. 바로 홍보 갑니다.",
  "이번에 새로운 홍보글이 도착했습니다. 담당자 바로 출동합니다.",
  "방금 확인한 새 글입니다. 소식 식기 전에 소개합니다.",
  "새 글 올라왔네요. 오늘도 홍보할 일이 생겼습니다.",
];
const EVENT_OPENERS = [
  "더홍보에서 새로 올라온 이벤트 안내 글을 소개합니다.",
  "더홍보에 등록된 새 이벤트 소식을 전해드립니다.",
  "더홍보에서 최신 이벤트 안내 글을 알려드립니다.",
  "새 이벤트 안내가 올라왔습니다. 더홍보가 대신 소개합니다.",
  "더홍보가 전하는 새 이벤트 안내입니다.",
  "더홍보에 올라온 이벤트 안내 글, 여기서도 만나보세요.",
];
const SIGNOFFS = [
  "더홍보에서 대신 광고해드리는 홍보글입니다.",
  "더홍보는 더홍보에 올라온 홍보글을 대신 알려드립니다.",
  "더홍보에 올려주신 소식, 더홍보가 대신 홍보합니다.",
  "여러분의 홍보글을 더홍보가 한 번 더 소개해드립니다.",
  "홍보글의 주인공은 여러분, 대신 알리는 곳은 더홍보입니다.",
  "더홍보에 담긴 소식이 더 알려지도록, 더홍보가 함께 홍보합니다.",
  "이번 홍보도 더홍보가 대신 전해드렸습니다.",
  "더홍보에 올라온 이야기, 더홍보가 밖에서도 알립니다.",
  "알리고 싶은 소식은 더홍보에. 대신 소개하는 일도 더홍보가 함께합니다.",
  "더홍보는 홍보글을 모으고, 그 소식을 대신 전합니다.",
  "더홍보가 대신 알리는 홍보 소식, 다음 소개도 이어집니다.",
  "등록하신 홍보글을 함께 알리는 더홍보입니다.",
  "새 글의 공식 SNS 홍보에 동의하시면 더홍보가 확인 후 대신 알려드려요.",
  "더홍보에 새 홍보글을 올리고 공식 SNS 홍보에도 참여해보세요.",
  "더홍보는 공식 SNS 홍보에 동의한 글을 확인해 대신 소개합니다.",
  "여러분의 소식을 대신 전하는 더홍보의 홍보였습니다.",
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
  const link = destination(post, siteUrl);
  // Freshness requires an explicit current source timestamp, never a bump timestamp.
  const published = Date.parse(post.published_at ?? '');
  const now = context.now ?? Date.now();
  const fresh = Number.isFinite(published) && now >= published && now - published <= 86400000;
  // Only call a source an event announcement when it explicitly announces one.
  const eventSource = [post.title, post.short_description].join(' ').normalize('NFKC');
  const event = /이벤트\s*(?:안내|소식|진행|개최|모집|오픈)|이벤트를\s*(?:진행|개최)/u.test(eventSource)
    && !/종료|마감|취소|없|않|아닙|아닌/u.test(eventSource);
  const pool = fresh ? (event ? [...FRESH_OPENERS, ...EVENT_OPENERS] : FRESH_OPENERS) : OPENERS;
  const opener = pool[Math.abs(id) % pool.length] + "\n\n";
  const question = "\n\n" + promoQuestion(post);
  const closer = "\n\n" + (link === joinUrl(siteUrl, post.post_id) ? '원문 보기: ' : '자세히 보기: ') + link +
    "\n\n" + SIGNOFFS[Math.abs(id) % SIGNOFFS.length] +
    "\n무료 홍보는 더홍보에서!";
  const titleRoom = Math.min(120, Math.max(0, MAX_THREADS_CHARS - weightedLength(opener + closer + question) - 64));
  const title = clipped(cleanedPublicExcerpt(post.title), titleRoom) + "\n\n";
  const room = Math.max(0, MAX_THREADS_CHARS - weightedLength(opener + title + closer + question));
  const source = cleanedPublicExcerpt(post.short_description) || cleanedPublicExcerpt(post.description) || "새로운 홍보 소식이 등록됐어요.";
  // Original source wins; AI is a supplementary, short social-friendly teaser.
  const sourceText = clipped(source, Math.min(230, room));
  const ai = cleanedPublicExcerpt(suggestedBody);
  const remaining = room - weightedLength(sourceText) - (ai ? 2 : 0);
  const teaser = remaining > 12 && ai && ai !== sourceText
    ? "\n\n" + clipped(ai, Math.min(100, remaining))
    : "";
  return appendPromoHashtags(opener + title + sourceText + teaser + closer, post, undefined, 500 - weightedLength(question)) + question;
}
