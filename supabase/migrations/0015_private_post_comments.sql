-- 일반 홍보글의 작성자·운영자 전용 비공개 댓글입니다.
create table public.private_post_comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  nickname text not null,
  body text not null check (char_length(body) between 1 and 3000),
  status text not null default 'active' check (status in ('active', 'deleted')),
  created_at timestamptz not null default now()
);
create index private_post_comments_thread on public.private_post_comments(post_id, created_at, id);
alter table public.private_post_comments enable row level security;
revoke all on public.private_post_comments from anon, authenticated;
grant all on public.private_post_comments to service_role;
grant usage, select on sequence public.private_post_comments_id_seq to service_role;
