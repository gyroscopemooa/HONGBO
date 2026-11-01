-- 기능 요청 접수. 서버(service_role)에서만 읽고 쓴다.
create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 5 and 1000),
  contact text,
  page text,
  reporter_id uuid references public.profiles (id) on delete set null,
  reporter_anon text,
  created_at timestamptz not null default now()
);
create index if not exists feature_requests_recent on public.feature_requests (created_at desc);
alter table public.feature_requests enable row level security;
revoke all on public.feature_requests from anon, authenticated;
grant all on public.feature_requests to service_role;
