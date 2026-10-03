import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** 로그인 세션(쿠키)을 읽고 갱신하는 서버용 클라이언트 (anon 키 사용) */
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // 서버 컴포넌트에서 호출된 경우 쿠키 쓰기는 무시 (proxy 가 세션을 갱신합니다)
        }
      },
    },
  });
}
