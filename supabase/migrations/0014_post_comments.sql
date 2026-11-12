begin;
create table public.post_comments (
 id bigint generated always as identity primary key,
 post_id bigint not null references public.posts(id) on delete cascade,
 author_id uuid references auth.users(id) on delete set null,
 nickname text not null check(char_length(nickname) between 1 and 100),
 body text not null check(char_length(btrim(body)) between 1 and 3000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 deleted_at timestamptz
);
create index post_comments_post_created on public.post_comments(post_id,created_at desc,id desc) where deleted_at is null;
alter table public.post_comments enable row level security;
revoke all on public.post_comments from public,anon,authenticated;
grant select,insert,update on public.post_comments to service_role;
grant usage,select on sequence public.post_comments_id_seq to service_role;
commit;
