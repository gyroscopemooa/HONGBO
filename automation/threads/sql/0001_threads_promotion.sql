-- Standalone, opt-in Threads promotion. Apply manually in Supabase SQL Editor.
-- This migration does not change existing posts or enable automatic publishing.

create table if not exists public.threads_promotion_jobs (
  post_id bigint primary key references public.posts(id) on delete cascade,
  status text not null check (status in ('processing','published','review')),
  draft_text text,
  threads_id text,
  error_message text,
  claimed_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists threads_jobs_status_time_idx
  on public.threads_promotion_jobs (status, claimed_at desc);
create index if not exists threads_jobs_published_idx
  on public.threads_promotion_jobs (published_at desc)
  where status = 'published';

-- Only the service role can operate on jobs; users cannot see third-party publishing logs.
alter table public.threads_promotion_jobs enable row level security;

-- One database transaction reserves a single unseen, eligible post.
-- A job stays "processing" in ambiguous failures to avoid accidental re-posting.
create or replace function public.threads_claim_one(
  p_since timestamptz,
  p_max_daily integer default 6
)
returns table (
  post_id bigint,
  title text,
  short_description text,
  description text
)
language plpgsql security definer set search_path = public
as $$
declare v_post_id bigint;
begin
  if p_since is null then return; end if;
  if (
    select count(*) from public.threads_promotion_jobs
    where claimed_at >= now() - interval '24 hours'
  ) >= greatest(1, least(coalesce(p_max_daily, 6), 20)) then
    return;
  end if;

  select p.id into v_post_id
    from public.posts p
   where p.status = 'active'
     and p.is_seed = false
     and p.published_at >= p_since
     and (p.expires_at is null or p.expires_at > now())
     and not exists (
       select 1 from public.threads_promotion_jobs j where j.post_id = p.id
     )
   order by p.published_at asc, p.id asc
   limit 1
   for update of p skip locked;

  if v_post_id is null then return; end if;

  insert into public.threads_promotion_jobs(post_id, status)
  values (v_post_id, 'processing')
  on conflict (post_id) do nothing;

  if not found then return; end if;

  return query
  select p.id, p.title, p.short_description, p.description
    from public.posts p where p.id = v_post_id;
end;
$$;

create or replace function public.threads_finish_job(
  p_post_id bigint,
  p_status text,
  p_draft_text text default null,
  p_threads_id text default null,
  p_error_message text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_status not in ('published','review') then
    raise exception 'invalid Threads job status';
  end if;

  update public.threads_promotion_jobs
     set status = p_status,
         draft_text = left(p_draft_text, 1000),
         threads_id = left(p_threads_id, 100),
         error_message = left(p_error_message, 400),
         published_at = case when p_status='published' then now() else null end
   where post_id = p_post_id and status = 'processing';
end;
$$;

revoke all on function public.threads_claim_one(timestamptz, integer) from public, anon, authenticated;
revoke all on function public.threads_finish_job(bigint, text, text, text, text) from public, anon, authenticated;
grant execute on function public.threads_claim_one(timestamptz, integer) to service_role;
grant execute on function public.threads_finish_job(bigint, text, text, text, text) to service_role;
