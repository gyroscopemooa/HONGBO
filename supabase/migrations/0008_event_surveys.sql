-- 더홍보 자체 이벤트 설문 응답 (설문 정의는 posts.extra.exclusive.survey에 보관)
-- 먼저 운영 Supabase에 이 마이그레이션을 적용한 뒤 자체 설문을 사용하세요.
create table if not exists public.event_survey_responses (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  anon_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  created_at timestamptz not null default now(),
  unique (post_id, anon_id)
);

create index if not exists event_survey_responses_post_recent_idx
  on public.event_survey_responses(post_id, created_at desc);

alter table public.event_survey_responses enable row level security;
revoke all on public.event_survey_responses from public, anon, authenticated;
grant select, insert, delete on public.event_survey_responses to service_role;
