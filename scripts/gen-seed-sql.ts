/**
 * 운영자 초기 콘텐츠(seed)를 Supabase 에 넣을 SQL 로 만들어 supabase/seed.sql 에 씁니다.
 *
 *   npm run seed:sql
 *
 * 만들어진 supabase/seed.sql 을 Supabase SQL Editor 에서 실행하세요. (여러 번 실행해도 중복되지 않아요.)
 * 시드 글은 is_seed = true 라서 관리자 페이지에서 한 번에 숨기거나 삭제할 수 있습니다.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SEED_BANNERS, SEED_NOTICES, SEED_ORDER, SEED_POSTS, seedExternalUrl, seedImageUrl } from "../src/data/seed";

const q = (s: string | null | undefined) => (s == null ? "null" : `'${s.replace(/'/g, "''")}'`);
const arr = (a: string[]) => `array[${a.map((x) => q(x)).join(", ")}]::text[]`;
const json = (o: unknown) => `${q(JSON.stringify(o ?? {}))}::jsonb`;

const byId = new Map(SEED_POSTS.map((s) => [s.id, s]));

const postRows = SEED_ORDER.map((id, idx) => {
  const s = byId.get(id)!;
  const minutes = 2 + idx * 2;
  const at = `now() - interval '${minutes} minutes'`;
  return `  (${s.id}, ${q(s.category)}, ${q(s.title)}, ${q(s.short)}, ${q(s.description)}, ${q(seedImageUrl(s.id))}, ${q(seedExternalUrl(s.id))}, ${q(s.platform)}, ${q(s.price)}, ${q(s.region)}, ${q(s.address)}, ${arr(s.tags)}, ${json(s.extra)}, 'active', ${s.curated != null}, ${s.curated ?? "null"}, true, ${at}, ${at}, ${at})`;
}).sort((a, b) => Number(a.match(/\((\d+),/)![1]) - Number(b.match(/\((\d+),/)![1]));

const bannerRows = SEED_BANNERS.map(
  (b) =>
    `    (${q(b.title)}, ${q(b.subtitle)}, ${q(b.imageUrl)}, ${q(b.targetUrl)}, ${q(b.placement)}, ${q(b.theme)}, ${b.sortOrder}, ${b.isActive})`,
);

const noticeRows = SEED_NOTICES.map(
  (n, i) => `    (${q(n.title)}, ${q(n.body)}, ${n.isPinned}, now() - interval '${i * 12} hours')`,
);

const sql = `-- 자동 생성 파일입니다. (npm run seed:sql)
-- 더홍보 운영자 초기 콘텐츠: 홍보글 ${SEED_POSTS.length}개 / 배너 ${SEED_BANNERS.length}개 / 공지 ${SEED_NOTICES.length}개
-- 홍보글 이미지는 사이트의 /seed/*.svg 파일을 가리킵니다. (public/seed 폴더가 함께 배포되어야 해요)

begin;

insert into public.posts
  (id, category, title, short_description, description, primary_image_url, external_url, platform, price, region, address, tags, extra, status, admin_pinned, curated_rank, is_seed, published_at, bumped_at, updated_at)
overriding system value
values
${postRows.join(",\n")}
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.posts', 'id'), greatest((select max(id) from public.posts), 1000));

do $$
begin
  if not exists (select 1 from public.banners) then
    insert into public.banners (title, subtitle, image_url, target_url, placement, theme, sort_order, is_active) values
${bannerRows.join(",\n")};
  end if;
  if not exists (select 1 from public.notices) then
    insert into public.notices (title, body, is_pinned, published_at) values
${noticeRows.join(",\n")};
  end if;
end $$;

commit;
`;

const out = resolve(process.cwd(), "supabase", "seed.sql");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, sql);
console.log(`wrote ${out} (${sql.length.toLocaleString()} bytes)`);
