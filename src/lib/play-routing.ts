import { PLAY_PLACES } from "@/data/play";
import { PLAY_REGIONS } from "@/data/play-regions";
const detailSlugs = new Set(PLAY_PLACES.map(p=>p.slug));
const regionSlugs = new Set<string>(PLAY_REGIONS.map(r=>r.slug));
const sections = new Set(["archive","design","share","shared","dates"]);
/** Only editorial routes; member posts and other application routes keep their own routing. */
export function unknownPlayEditorialPath(pathname: string): boolean {
 const parts=pathname.replace(/\/$/,"").split("/").filter(Boolean);
 if(parts[0]!=="play")return false;
 if(parts[1]==="region")return parts.length!==3 || !regionSlugs.has(parts[2]);
 return parts.length===2 && !sections.has(parts[1]) && !detailSlugs.has(parts[1]);
}
export const PLAY_NOT_FOUND_HTML = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,follow"><title>여행 안내를 찾을 수 없습니다 | 놀러가자</title></head><body style="margin:0;background:#f4f8ff;color:#17345c;font-family:system-ui,sans-serif"><main style="max-width:640px;margin:12vh auto;padding:32px"><p>놀러가자 · 더홍보</p><h1>여행 안내를 찾을 수 없습니다</h1><p>주소를 확인하거나 여행지 목록에서 다시 찾아주세요.</p><a href="/play" style="color:#1762e8">여행지·축제 목록으로 돌아가기 →</a></main></body></html>';
