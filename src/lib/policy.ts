import { REGIONS } from "./constants";

/**
 * 기본 금지 키워드 필터 — 완벽한 자동 심사가 아니라 "명백한" 불법·스팸 홍보를 걸러내는 1차 장치입니다.
 * 오탐을 피하기 위해 짧은 일반 단어는 넣지 않고, 나머지는 신고 + 관리자 수동 처리로 대응합니다.
 */
const BANNED_KEYWORDS = [
  "토토사이트",
  "불법토토",
  "먹튀검증",
  "바카라사이트",
  "온라인카지노",
  "카지노사이트",
  "불법도박",
  "도박사이트",
  "성매매",
  "조건만남",
  "대포통장",
  "대포폰",
  "마약판매",
  "필로폰",
  "주민번호판매",
  "개인정보판매",
  "신용카드현금화",
  "무자료대출",
  "불법스포츠중계",
];

export function findBannedKeyword(...texts: Array<string | null | undefined>): string | null {
  const joined = texts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[\s​-‍﻿.,_\-~·ㆍ]/g, "");
  for (const k of BANNED_KEYWORDS) {
    if (joined.includes(k)) return k;
  }
  return null;
}

const REGION_PREFIXES: Array<[string, string]> = [
  ["서울", "서울"],
  ["부산", "부산"],
  ["대구", "대구"],
  ["인천", "인천"],
  ["광주", "광주"],
  ["대전", "대전"],
  ["울산", "울산"],
  ["세종", "세종"],
  ["경기", "경기"],
  ["강원", "강원"],
  ["충청북", "충북"],
  ["충북", "충북"],
  ["충청남", "충남"],
  ["충남", "충남"],
  ["전라북", "전북"],
  ["전북", "전북"],
  ["전북특별", "전북"],
  ["전라남", "전남"],
  ["전남", "전남"],
  ["경상북", "경북"],
  ["경북", "경북"],
  ["경상남", "경남"],
  ["경남", "경남"],
  ["제주", "제주"],
];

/** 주소 앞부분에서 시/도를 추정합니다. 못 찾으면 null. */
export function inferRegion(address: string | null | undefined): string | null {
  const a = (address ?? "").trim();
  if (!a) return null;
  for (const [prefix, region] of REGION_PREFIXES) {
    if (a.startsWith(prefix)) return region;
  }
  return null;
}

export function isRegion(v: string | null | undefined): v is (typeof REGIONS)[number] {
  return !!v && (REGIONS as readonly string[]).includes(v);
}
