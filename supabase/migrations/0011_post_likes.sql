-- 게시글 공개 좋아요. 개인 찜(favorites)과 별개이며 계정당 글마다 1회만 허용합니다.
alter table public.posts add column if not exists like_count integer not null default 0;
alter table public.posts drop constraint if exists posts_like_count_nonnegative;
alter table public.posts add constraint posts_like_count_nonnegative check (like_count >= 0);

create table if not exists public.post_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id bigint not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index if not exists post_likes_post_idx on public.post_likes (post_id);

-- service_role 서버 액션만 변경할 수 있습니다. 익명/클라이언트 직접 조작은 차단합니다.
alter table public.post_likes enable row level security;
revoke all on public.post_likes from anon, authenticated;
grant all on public.post_likes to service_role;

create or replace function public.sync_post_like_count() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_count_changed on public.post_likes;
create trigger post_likes_count_changed
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_like_count();

-- 재실행하거나 기존 좋아요 데이터가 있을 때도 집계가 정확하도록 동기화합니다.
update public.posts p
set like_count = (select count(*)::integer from public.post_likes l where l.post_id = p.id);
