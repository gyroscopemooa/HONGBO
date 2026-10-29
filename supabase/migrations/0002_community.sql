-- Run before deploying the community board. Writes are server/admin only.
create table public.community_posts (
  id uuid primary key,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint community_status check (content->>'status' in ('draft', 'published')),
  constraint community_topic check (content->>'topic' in ('promotion', 'content', 'website', 'service'))
);
create index community_public_recent on public.community_posts ((content->>'status'), published_at desc);
create index community_topic_recent on public.community_posts ((content->>'topic'), published_at desc);
alter table public.community_posts enable row level security;
-- No anon/authenticated policy: private editorial notes never leave the server.
revoke all on public.community_posts from anon, authenticated;
grant all on public.community_posts to service_role;
