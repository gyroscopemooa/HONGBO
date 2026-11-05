-- 배너 광고의 직접 제작/업로드 정보 (mode: upload | custom, imageUrl, title, subtitle, tone). 비어 있으면 자동 제작.
alter table public.ads add column if not exists creative jsonb;
