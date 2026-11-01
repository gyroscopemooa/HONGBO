-- 찜하기. 개수는 공개하지 않고 본인 목록으로만 쓴다. 서버(service_role)에서만 읽고 쓴다.
create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id bigint not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index if not exists favorites_user_recent on public.favorites (user_id, created_at desc);
alter table public.favorites enable row level security;
revoke all on public.favorites from anon, authenticated;
grant all on public.favorites to service_role;
