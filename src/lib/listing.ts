import { isRegion } from "./policy";
import { cleanQuery, parsePositiveInt, pickFirst } from "./utils";

export type SearchParams = Record<string, string | string[] | undefined>;

export interface ListParams {
  sort: "latest" | "popular";
  page: number;
  region?: string;
  q: string;
}

export function parseListParams(sp: SearchParams, defaultSort: ListParams["sort"] = "latest"): ListParams {
  const sortRaw = pickFirst(sp.sort);
  const region = pickFirst(sp.region);
  return {
    sort: sortRaw === "popular" ? "popular" : sortRaw === "latest" ? "latest" : defaultSort,
    page: Math.min(parsePositiveInt(sp.page, 1), 500),
    region: isRegion(region) ? region : undefined,
    q: cleanQuery(sp.q),
  };
}

/** 쿼리스트링을 가진 URL 생성 (값이 없거나 기본값이면 생략) */
export function buildHref(base: string, params: Record<string, string | number | undefined | null>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}
