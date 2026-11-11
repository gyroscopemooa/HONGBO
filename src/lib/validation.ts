import { PLAY_KINDS, playBenefitValues } from "./play-conditions";
import { playConditionsSchema } from "./play-conditions-validation";
import { z } from "zod";
import {
  APP_PLATFORMS,
  BENEFITS,
  BENEFIT_MAX,
  EXCLUSIVE_CODE_MAX,
  EXCLUSIVE_HOW_MAX,
  EXCLUSIVE_METHODS,
  EXCLUSIVE_REWARD_MAX,
  type ExclusiveMethod,
  EXCLUSIVE_SLUG,
  SURVEY_MAX_QUESTIONS,
  SURVEY_CONTACT_ID,
  SURVEY_OTHER_LABEL,
  SURVEY_MAX_OPTIONS,
  SURVEY_QUESTION_MAX,
  SURVEY_OPTION_MAX,
  EXTRA_LINK_LABEL_MAX,
  COUPON_CODE_MAX,
  COUPON_NOTE_MAX,
  EXTRA_LINK_MAX,
  EXTRA_NOTE_MAX,
  EXTRA_NOTE_TITLE_MAX,
  EXTRA_NOTE_BODY_MAX,
  CATEGORY_SLUGS,
  LIMITS,
  SNS_PLATFORMS,
  USAGE_TYPES,
  type CategorySlug,
} from "./constants";
import { parseYoutubeId } from "./youtube";
import { findBannedKeyword, inferRegion, isRegion } from "./policy";
import type { PostExtra, PostInput, SurveyPayout, SurveyQuestion } from "./types";
import { isAllowedImageUrl, isMapUrl, normalizeExternalUrl } from "./url";

const str = (max: number) => z.string().max(max).optional().nullable();

/** 클라이언트에서 넘어오는 값의 "모양"만 먼저 검사합니다(길이/타입). 의미 검증은 parsePostInput 에서. */
const rawSchema = z.object({
  category: z.string().max(20),
  title: z.string().max(200).default(""),
  shortDescription: z.string().max(400).default(""),
  description: z.string().max(LIMITS.descMax + 2000).default(""),
  primaryImageUrl: str(1000),
  images: z.array(z.string().max(1000)).max(20).default([]),
  externalUrl: str(2100),
  platform: str(100),
  price: str(200),
  region: str(40),
  address: str(400),
  mapUrl: str(2100),
  tags: z.array(z.string().max(100)).max(30).default([]),
  contact: str(400),
  extra: z
    .object({
      play: playConditionsSchema.optional(),
      notes: z.array(z.object({ title: z.string().max(200), body: z.string().max(2000) })).max(20).optional(),
      couponCode: str(400),
      couponNote: str(1000),
      playUrl: str(2100),
      appStoreUrl: str(2100),
      siteUrl: str(2100),
      usageType: str(40),
      period: str(200),
      benefits: str(200),
      exclusiveOn: z.boolean().optional(),
      exclusiveAgree: z.boolean().optional(),
      exclusiveReward: str(400),
      exclusiveHow: str(400),
      exclusiveMethod: str(20),
      exclusiveCode: str(200),
      exclusiveUrl: str(2100),
      surveyPayout: str(20),
      surveyRewardText: str(400),
      surveyQuestions: z.array(z.object({
        id: z.string().max(64),
        title: z.string().max(200),
        type: z.enum(["choice", "text"]),
        required: z.boolean(),
        allowOther: z.boolean().optional(),
        options: z.array(z.string().max(100)).max(10).optional(),
      })).max(10).optional(),
      businessUrl: str(2100),
      videoUrl: str(2100),
      links: z.array(z.object({ label: z.string().max(100), url: z.string().max(2100) })).max(20).default(() => []),
    })
    .default({ links: [] }),
});

export type FieldErrors = Record<string, string>;
export type ParseResult =
  | { ok: true; data: PostInput }
  | { ok: false; errors: FieldErrors; message: string };

function blankToNull(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  return s ? s : null;
}

/** 폼에서 받은 홍보글 입력을 서버에서 다시 검증/정리합니다. (클라이언트 검증은 믿지 않습니다.) */
export function parsePostInput(raw: unknown): ParseResult {
  const shape = rawSchema.safeParse(raw);
  if (!shape.success) {
    return { ok: false, errors: Object.fromEntries(shape.error.issues.map(i=>[i.path.join("."), i.message])), message: "입력값을 확인해주세요." };
  }
  const v = shape.data;
  const errors: FieldErrors = {};

  if (!CATEGORY_SLUGS.includes(v.category as CategorySlug)) {
    errors.category = "카테고리를 선택해주세요.";
  }
  const category = v.category as CategorySlug;

  const title = v.title.replace(/\s+/g, " ").trim();
  if (title.length < 2) errors.title = "제목을 2자 이상 입력해주세요.";
  else if (title.length > LIMITS.titleMax) errors.title = `제목은 ${LIMITS.titleMax}자까지 입력할 수 있어요.`;

  const shortDescription = v.shortDescription.replace(/\s+/g, " ").trim();
  if (shortDescription.length < 2) errors.shortDescription = "한 줄 소개를 입력해주세요.";
  else if (shortDescription.length > LIMITS.shortMax)
    errors.shortDescription = `한 줄 소개는 ${LIMITS.shortMax}자까지 입력할 수 있어요.`;

  const description = v.description.replace(/\r\n/g, "\n").trim();
  if (description.length < LIMITS.descMin) errors.description = `상세 설명을 ${LIMITS.descMin}자 이상 입력해주세요.`;
  else if (description.length > LIMITS.descMax)
    errors.description = `상세 설명은 ${LIMITS.descMax.toLocaleString()}자까지 입력할 수 있어요.`;

  // --- 링크 ---
  const extra: PostExtra = {};
  if (v.extra.play) extra.play = v.extra.play;
  const linkField = (
    key: "externalUrl" | "mapUrl" | "playUrl" | "appStoreUrl" | "siteUrl" | "businessUrl",
    value: string | null | undefined,
    required = false,
  ): string | null => {
    const s = blankToNull(value);
    if (!s) {
      if (required) errors[key] = "링크를 입력해주세요.";
      return null;
    }
    const r = normalizeExternalUrl(s);
    if (!r.ok) {
      errors[key] = r.error ?? "올바른 링크가 아니에요.";
      return null;
    }
    return r.url;
  };

  const videoInput = blankToNull(v.extra.videoUrl);
  if (videoInput) {
    const ytId = parseYoutubeId(videoInput);
    if (ytId) extra.youtubeId = ytId;
    else errors.videoUrl = "유튜브 영상 주소를 입력해주세요. (youtube.com, youtu.be)";
  }

  const benefitList = (v.extra.play ? playBenefitValues(v.extra.play).join(",") : (v.extra.benefits ?? ""))
    .split(",")
    .map((s) => s.trim())
    .filter((s) => (BENEFITS.map((b) => b.value) as string[]).includes(s));
  const benefitsFinal = Array.from(new Set(benefitList)).slice(0, BENEFIT_MAX);

  // --- 더홍보 전용 이벤트 ---
  if (v.extra.exclusiveOn) {
    const reward = (v.extra.exclusiveReward ?? "").replace(/\s+/g, " ").trim();
    const how = (v.extra.exclusiveHow ?? "").replace(/\s+/g, " ").trim();
    if (reward.length < 2) errors.exclusiveReward = "더홍보 전용 혜택 내용을 입력해주세요.";
    else if (reward.length > EXCLUSIVE_REWARD_MAX) errors.exclusiveReward = `혜택 내용은 ${EXCLUSIVE_REWARD_MAX}자까지 입력할 수 있어요.`;
    const method = (EXCLUSIVE_METHODS.map((m) => m.value) as string[]).includes(v.extra.exclusiveMethod ?? "")
      ? (v.extra.exclusiveMethod as ExclusiveMethod)
      : "say";
    if (method === "say" && how.length < 2) errors.exclusiveHow = "받는 방법을 입력해주세요. (예: 주문 시 '더홍보' 라고 말씀하세요)";
    else if (how.length > EXCLUSIVE_HOW_MAX) errors.exclusiveHow = `받는 방법은 ${EXCLUSIVE_HOW_MAX}자까지 입력할 수 있어요.`;
    let code: string | undefined;
    let exUrl: string | undefined;
    const payout: SurveyPayout = v.extra.surveyPayout === "draw" ? "draw" : "instant";
    let rewardText: string | undefined;
    if (method === "code") {
      const c = (v.extra.exclusiveCode ?? "").trim();
      if (!c) errors.exclusiveCode = "쿠폰 번호(코드)를 입력해주세요.";
      else if (c.length > EXCLUSIVE_CODE_MAX || /\s/.test(c)) errors.exclusiveCode = `공백 없이 ${EXCLUSIVE_CODE_MAX}자 이내로 입력해주세요.`;
      else code = c;
    }
    if (method === "link") {
      const r = normalizeExternalUrl((v.extra.exclusiveUrl ?? "").trim());
      if (!r.ok) errors.exclusiveUrl = r.error ?? "전용 링크를 입력해주세요.";
      else exUrl = r.url;
    }
    if (method === "survey" && payout === "instant") {
      // 즉시 지급: 완료 화면에 보여줄 안내(코드·방법)와 링크 중 하나 이상
      const text = (v.extra.surveyRewardText ?? "").replace(/[ \t]+/g, " ").trim();
      const rawUrl = (v.extra.exclusiveUrl ?? "").trim();
      if (text.length > 300) errors.exclusiveSurvey = "지급 안내는 300자까지 입력할 수 있어요.";
      else if (!text && !rawUrl) errors.exclusiveSurvey = "설문 완료 후 보여줄 혜택 안내(코드·방법)나 링크 중 하나는 입력해주세요.";
      if (text) rewardText = text;
      if (rawUrl) {
        const r = normalizeExternalUrl(rawUrl);
        if (!r.ok) errors.exclusiveUrl = r.error ?? "링크를 확인해주세요.";
        else exUrl = r.url;
      }
    }
    let survey: SurveyQuestion[] | undefined;
    if (method === "survey") {
      const submitted = v.extra.surveyQuestions ?? [];
      if (!submitted.length || submitted.length > SURVEY_MAX_QUESTIONS) {
        errors.exclusiveSurvey = `설문 질문은 1~${SURVEY_MAX_QUESTIONS}개 작성해주세요.`;
      } else {
        const ids = new Set<string>();
        const parsed: SurveyQuestion[] = [];
        for (const q of submitted) {
          const title = q.title.replace(/\s+/g, " ").trim();
          if (!/^[a-zA-Z0-9_-]{1,64}$/.test(q.id) || q.id === SURVEY_CONTACT_ID || ids.has(q.id) || title.length < 2 || title.length > SURVEY_QUESTION_MAX) {
            errors.exclusiveSurvey = "각 질문은 2~100자로 작성하고, 중복되지 않는 질문 ID를 사용해주세요.";
            break;
          }
          ids.add(q.id);
          if (q.type === "choice") {
            const options = (q.options ?? []).map((o) => o.replace(/\s+/g, " ").trim());
            if (options.length < 2 || options.length > SURVEY_MAX_OPTIONS || options.some((o) => !o || o.length > SURVEY_OPTION_MAX) || new Set(options).size !== options.length) {
              errors.exclusiveSurvey = `객관식 선택지는 2~${SURVEY_MAX_OPTIONS}개, 각각 ${SURVEY_OPTION_MAX}자 이내로 서로 다르게 작성해주세요.`;
              break;
            }
            if (q.allowOther && options.includes(SURVEY_OTHER_LABEL)) {
              errors.exclusiveSurvey = "'기타(직접 입력)'를 켠 질문에는 선택지 이름을 '기타'로 따로 만들 수 없어요.";
              break;
            }
            parsed.push({ id: q.id, title, type: "choice", required: q.required, options, ...(q.allowOther ? { allowOther: true } : {}) });
          } else {
            parsed.push({ id: q.id, title, type: "text", required: q.required });
          }
        }
        if (!errors.exclusiveSurvey) survey = parsed;
      }
    }
    if (!v.extra.exclusiveAgree) errors.exclusiveAgree = "전용 이벤트 안내에 동의해주세요.";
    if (!errors.exclusiveReward && !errors.exclusiveHow && !errors.exclusiveCode && !errors.exclusiveUrl && !errors.exclusiveSurvey && !errors.exclusiveAgree) {
      extra.exclusive = { reward, how, method, ...(code ? { code } : {}), ...(exUrl ? { url: exUrl } : {}), ...(survey ? { survey, payout, ...(rewardText ? { rewardText } : {}) } : {}) };
      benefitsFinal.push(EXCLUSIVE_SLUG);
    }
  }
  if (benefitsFinal.length) extra.benefits = benefitsFinal;

  const notes: Array<{ title: string; body: string }> = [];
  if ((v.extra.notes ?? []).length > EXTRA_NOTE_MAX) errors.notes = `추가 안내는 최대 ${EXTRA_NOTE_MAX}개까지 등록할 수 있어요.`;
  (v.extra.notes ?? []).forEach((note, i) => {
    const title = note.title.replace(/\s+/g, " ").trim();
    const body = note.body.replace(/\r\n/g, "\n").trim();
    if (!title && !body) return;
    if (!title || !body) errors[`notes.${i}`] = "안내 제목과 내용을 모두 입력해주세요.";
    else if (title.length > EXTRA_NOTE_TITLE_MAX || body.length > EXTRA_NOTE_BODY_MAX) errors[`notes.${i}`] = `제목은 ${EXTRA_NOTE_TITLE_MAX}자, 내용은 ${EXTRA_NOTE_BODY_MAX}자까지 입력해주세요.`;
    else notes.push({ title, body });
  });
  if (notes.length) extra.notes = notes;

  const couponCode = benefitsFinal.includes("coupon") ? (v.extra.couponCode ?? "").trim() : "";
  const couponNote = benefitsFinal.includes("coupon") ? (v.extra.couponNote ?? "").trim() : "";
  if (couponCode.length > COUPON_CODE_MAX || /[\r\n\t]/.test(couponCode)) errors.couponCode = `쿠폰 코드는 줄바꿈 없이 ${COUPON_CODE_MAX}자까지 입력해주세요.`;
  if (couponNote.length > COUPON_NOTE_MAX) errors.couponNote = `사용 안내는 ${COUPON_NOTE_MAX}자까지 입력해주세요.`;
  if (couponNote && !couponCode) errors.couponCode = "사용 안내와 함께 제공할 쿠폰 코드를 입력해주세요.";
  if (couponCode) {
    extra.couponCode = couponCode;
    if (couponNote) extra.couponNote = couponNote;
  }

  // --- 추가 링크 (모든 카테고리 공통) ---
  const extraLinks: Array<{ label: string; url: string }> = [];
  v.extra.links.forEach((l, i) => {
    const label = l.label.replace(/\s+/g, " ").trim();
    const rawUrl = l.url.trim();
    if (!label && !rawUrl) return; // 빈 줄은 무시
    if (!label) {
      errors[`links.${i}`] = "링크 제목을 입력해주세요.";
      return;
    }
    if (label.length > EXTRA_LINK_LABEL_MAX) {
      errors[`links.${i}`] = `링크 제목은 ${EXTRA_LINK_LABEL_MAX}자까지 입력할 수 있어요.`;
      return;
    }
    if (!rawUrl) {
      errors[`links.${i}`] = "링크 주소를 입력해주세요.";
      return;
    }
    const r = normalizeExternalUrl(rawUrl);
    if (!r.ok) {
      errors[`links.${i}`] = r.error ?? "올바른 링크가 아니에요.";
      return;
    }
    if (extraLinks.some((x) => x.url === r.url)) return; // 중복 주소는 한 번만
    extraLinks.push({ label, url: r.url });
  });
  if (extraLinks.length > EXTRA_LINK_MAX) errors.links = `추가 링크는 최대 ${EXTRA_LINK_MAX}개까지 등록할 수 있어요.`;
  else if (extraLinks.length) extra.links = extraLinks;

  let externalUrl: string | null = null;
  let mapUrl: string | null = null;
  let address: string | null = blankToNull(v.address);
  let platform: string | null = null;
  let price: string | null = blankToNull(v.price);

  switch (category) {
    case "apps": {
      const play = linkField("playUrl", v.extra.playUrl);
      const store = linkField("appStoreUrl", v.extra.appStoreUrl);
      const site = linkField("siteUrl", v.extra.siteUrl);
      if (!play && !store && !site && !errors.playUrl && !errors.appStoreUrl && !errors.siteUrl) {
        errors.playUrl = "Google Play, App Store, 공식 사이트 중 하나 이상 입력해주세요.";
      }
      if (play) extra.playUrl = play;
      if (store) extra.appStoreUrl = store;
      if (site) extra.siteUrl = site;
      externalUrl = play || store || site;
      const allowed = APP_PLATFORMS.map((p) => p.value) as string[];
      const list = (v.platform ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => allowed.includes(s));
      platform = list.length ? Array.from(new Set(list)).join(",") : null;
      break;
    }
    case "offline": {
      const biz = linkField("businessUrl", v.extra.businessUrl);
      mapUrl = linkField("mapUrl", v.mapUrl);
      if (mapUrl && !isMapUrl(mapUrl)) {
        errors.mapUrl = "네이버지도, 카카오맵, Google Maps 링크를 입력해주세요.";
      }
      if (!biz && !mapUrl && !errors.businessUrl && !errors.mapUrl) {
        errors.mapUrl = "지도 링크 또는 영업/문의 링크 중 하나는 입력해주세요.";
      }
      if (biz) extra.businessUrl = biz;
      externalUrl = biz || mapUrl;
      break;
    }
    case "content": {
      externalUrl = linkField("externalUrl", v.externalUrl, true);
      const allowed = SNS_PLATFORMS.map((p) => p.value) as string[];
      const p = (v.platform ?? "").trim();
      platform = allowed.includes(p) ? p : "other";
      break;
    }
    case "services": {
      externalUrl = linkField("externalUrl", v.externalUrl, true);
      const u = (v.extra.usageType ?? "").trim();
      if ((USAGE_TYPES.map((x) => x.value) as string[]).includes(u)) extra.usageType = u;
      break;
    }
    case "events": {
      externalUrl = linkField("externalUrl", v.externalUrl, !(v.extra.exclusiveOn && v.extra.exclusiveMethod === "survey"));
      const period = blankToNull(v.extra.period);
      if (period) extra.period = period.slice(0, 80);
      break;
    }
    case "quick": {
      // 한줄홍보는 링크가 선택 사항
      externalUrl = linkField("externalUrl", v.externalUrl);
      break;
    }
    default: {
      externalUrl = linkField("externalUrl", v.externalUrl, true);
    }
  }

  if (category !== "products") price = null;
  else if (price && price.length > LIMITS.priceMax) errors.price = `가격은 ${LIMITS.priceMax}자까지 입력할 수 있어요.`;
  if (category !== "offline") {
    mapUrl = null;
    address = null;
  } else if (address && address.length > LIMITS.addressMax) {
    errors.address = `주소는 ${LIMITS.addressMax}자까지 입력할 수 있어요.`;
  }

  // --- 지역 ---
  let region = blankToNull(v.region);
  if (region && !isRegion(region)) {
    errors.region = "지역을 목록에서 선택해주세요.";
    region = null;
  }
  if (!region && category === "offline") region = inferRegion(address);

  // --- 태그 ---
  const tagSet = new Set<string>();
  for (const t of v.tags) {
    const tag = t.replace(/^#+/, "").replace(/\s+/g, " ").trim().slice(0, LIMITS.tagMax);
    if (tag) tagSet.add(tag);
  }
  if (v.extra.play && tagSet.has("놀러가자")) {
    for (const kind of PLAY_KINDS) tagSet.delete(kind);
    tagSet.add(v.extra.play.kind);
  }
  const tags = Array.from(tagSet);
  if (tags.length > LIMITS.tagsMax) errors.tags = `태그는 최대 ${LIMITS.tagsMax}개까지 등록할 수 있어요.`;

  // --- 이미지 ---
  const primary = blankToNull(v.primaryImageUrl);
  let primaryImageUrl: string | null = null;
  if (primary) {
    if (isAllowedImageUrl(primary)) primaryImageUrl = primary;
    else errors.primaryImageUrl = "이미지를 다시 업로드해주세요.";
  }
  const images: string[] = [];
  for (const img of v.images) {
    const s = img.trim();
    if (!s) continue;
    if (!isAllowedImageUrl(s)) {
      errors.images = "이미지를 다시 업로드해주세요.";
      break;
    }
    images.push(s);
  }
  if (images.length > LIMITS.extraImagesMax) errors.images = `추가 이미지는 최대 ${LIMITS.extraImagesMax}장까지 등록할 수 있어요.`;

  // --- 연락처(공개 선택 시에만 값이 넘어옴) ---
  const contact = blankToNull(v.contact);
  if (contact && contact.length > LIMITS.contactMax) errors.contact = `연락처는 ${LIMITS.contactMax}자까지 입력할 수 있어요.`;

  // --- 금지 키워드 ---
  const banned = findBannedKeyword(v.extra.play ? Object.values(v.extra.play).join(" ") : "", notes.map((n) => `${n.title} ${n.body}`).join(" "), couponCode, couponNote, title, shortDescription, description, tags.join(" "), address, extraLinks.map((l) => l.label).join(" "), extra.exclusive?.reward ?? "", extra.exclusive?.how ?? "", (extra.exclusive?.survey ?? []).map((q) => [q.title, ...(q.options ?? [])].join(" ")).join(" "));
  if (banned) {
    errors.description = "운영정책상 등록할 수 없는 내용이 포함되어 있어요. 내용을 확인해주세요.";
  }

  const linkOptional = category === "quick" || (category === "events" && extra.exclusive?.method === "survey");
  if (Object.keys(errors).length > 0 || (!externalUrl && !linkOptional)) {
    if (!externalUrl && !linkOptional && !errors.externalUrl && !errors.playUrl && !errors.mapUrl && !errors.businessUrl) {
      errors.externalUrl = "링크를 입력해주세요.";
    }
    return { ok: false, errors, message: "입력한 내용을 다시 확인해주세요." };
  }

  return {
    ok: true,
    data: {
      category,
      title,
      shortDescription,
      description,
      primaryImageUrl,
      images,
      externalUrl,
      platform,
      price,
      region,
      address,
      mapUrl,
      tags,
      extra,
      contact,
    },
  };
}
