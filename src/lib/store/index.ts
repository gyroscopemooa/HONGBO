import "server-only";
import { supabaseConfigured } from "../env";
import { localStore } from "./local";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

/**
 * 저장소 선택:
 *  - Supabase 환경변수가 모두 있으면 Supabase(Postgres)
 *  - 없으면 로컬 파일 저장소(.data/db.json) — 개발/미리보기용
 *
 * Cloudflare Workers 처럼 환경변수가 "요청 시점"에 주입되는 런타임에서도 올바르게 고르도록,
 * 모듈이 로드될 때가 아니라 메서드를 호출할 때마다 선택합니다.
 */
export const store: Store = new Proxy({} as Store, {
  get(_target, prop) {
    const impl = (supabaseConfigured() ? supabaseStore : localStore) as unknown as Record<string | symbol, unknown>;
    return impl[prop];
  },
});

export type { Store, ListQuery, ListSort } from "./types";
