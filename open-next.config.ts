import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 모든 페이지가 요청 시점에 렌더링되고(ISR/fetch 캐시 미사용) 이미지는 Supabase Storage 에서 직접 제공하므로
// 별도의 캐시(R2)나 이미지 최적화 바인딩 없이 기본 설정을 사용합니다.
export default defineCloudflareConfig({});
