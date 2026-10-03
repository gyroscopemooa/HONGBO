import { z } from "zod";
import {
  APP_PLATFORMS,
  CATEGORY_SLUGS,
  LIMITS,
  SNS_PLATFORMS,
  USAGE_TYPES,
  type CategorySlug,
} from "./constants";
import { findBannedKeyword, inferRegion, isRegion } from "./policy";
import type { PostExtra, PostInput } from "./types";
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
      playUrl: str(2100),
      appStoreUrl: str(2100),
      siteUrl: str(2100),
      usageType: str(40),
      period: str(200),
      businessUrl: str(2100),
    })
    .default({}),
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
    return { ok: false, errors: {}, message: "입력값을 확인해주세요." };
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
      externalUrl = linkField("externalUrl", v.externalUrl, true);
      const period = blankToNull(v.extra.period);
      if (period) extra.period = period.slice(0, 80);
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
  const banned = findBannedKeyword(title, shortDescription, description, tags.join(" "), address);
  if (banned) {
    errors.description = "운영정책상 등록할 수 없는 내용이 포함되어 있어요. 내용을 확인해주세요.";
  }

  if (Object.keys(errors).length > 0 || !externalUrl) {
    if (!externalUrl && !errors.externalUrl && !errors.playUrl && !errors.mapUrl && !errors.businessUrl) {
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
