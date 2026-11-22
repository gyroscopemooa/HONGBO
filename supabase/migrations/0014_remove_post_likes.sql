-- 좋아요 기능 제거: 기존 반응 데이터와 집계 컬럼을 정리합니다.
drop trigger if exists post_likes_count_changed on public.post_likes;
drop function if exists public.sync_post_like_count();
drop table if exists public.post_likes;

alter table public.posts drop constraint if exists posts_like_count_nonnegative;
alter table public.posts drop column if exists like_count;
