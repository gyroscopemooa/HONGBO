-- Apply AFTER 0001, only after operator review. No existing posts are modified.
begin;
create table public.threads_promotion_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  use_ai boolean not null default false,
  daily_limit integer not null default 6 check (daily_limit between 1 and 20)
);
insert into public.threads_promotion_settings default values;
create table public.threads_promotion_permissions (
  post_id bigint primary key references public.posts(id) on delete cascade,
  author_id uuid not null,
  consent_at timestamptz,
  consent_version text not null default 'threads-v1',
  excluded boolean not null default false,
  approved_hash text,
  approved_by uuid,
  approved_at timestamptz
);
alter table public.threads_promotion_settings enable row level security;
alter table public.threads_promotion_permissions enable row level security;
revoke all on public.threads_promotion_settings, public.threads_promotion_permissions,
  public.threads_promotion_jobs from public, anon, authenticated;
grant all on public.threads_promotion_settings, public.threads_promotion_permissions,
  public.threads_promotion_jobs to service_role;

-- Keep deduplication history even if the original is physically deleted.
alter table public.threads_promotion_jobs drop constraint threads_promotion_jobs_post_id_fkey;
alter table public.threads_promotion_jobs drop constraint threads_promotion_jobs_status_check;
alter table public.threads_promotion_jobs add constraint threads_promotion_jobs_status_check
  check (status in ('processing','publishing','published','retry','review','blocked'));
alter table public.threads_promotion_jobs
  add column lease uuid,
  add column attempts integer not null default 1,
  add column next_attempt_at timestamptz,
  add column source_hash text,
  add column container_id text,
  add column threads_url text,
  add column publish_started_at timestamptz;

create function public.threads_source_hash(p public.posts) returns text
language sql immutable set search_path = public as $$
  select md5(jsonb_build_array(p.author_id,p.title,p.short_description,p.description,p.contact,p.address,p.extra,p.external_url,
    to_jsonb(p)->'primary_image_url',to_jsonb(p)->'images',to_jsonb(p)->'tags')::text)
$$;

-- Server authenticates the actor; these RPCs are never executable with browser keys.
create function public.threads_consent(p_post_id bigint, p_actor uuid, p_consent boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from posts where id=p_post_id and author_id=p_actor and not is_seed and status <> 'deleted')
    then raise exception 'owner required'; end if;
  insert into threads_promotion_permissions(post_id,author_id,consent_at)
    values(p_post_id,p_actor,case when p_consent then now() end)
  on conflict(post_id) do update set consent_at=case when p_consent then now() end,
    approved_hash=null,approved_at=null,approved_by=null;
end $$;

create function public.threads_moderate(p_post_id bigint,p_actor uuid,p_hash text,p_excluded boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update threads_promotion_permissions c set excluded=p_excluded,
    approved_hash=case when not p_excluded then p_hash end,
    approved_by=p_actor,approved_at=now()
  from posts p where p.id=c.post_id and p.id=p_post_id and c.consent_at is not null
    and c.author_id=p.author_id and threads_source_hash(p)=p_hash;
  if not found then raise exception 'content changed or consent missing'; end if;
end $$;

drop function public.threads_claim_one(timestamptz,integer);
create function public.threads_claim_one(p_since timestamptz,p_max_daily integer default 6)
returns table(post_id bigint,title text,short_description text,description text,lease uuid,source_hash text,use_ai boolean)
language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_lease uuid := gen_random_uuid(); s threads_promotion_settings;
begin
  select * into s from threads_promotion_settings where id for update;
  -- A dead execution is NEVER taken over: the publishing outcome may be unknown.
  update threads_promotion_jobs set status='review',error_message='STALE_EXECUTION'
    where status in ('processing','publishing') and claimed_at < now()-interval '15 minutes';
  if not s.enabled or p_since is null then return; end if;
  if (select count(*) from threads_promotion_jobs where status in ('processing','publishing') or
      greatest(claimed_at,coalesce(published_at,claimed_at)) >=
      (date_trunc('day',now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'))
      >= least(s.daily_limit,greatest(1,least(coalesce(p_max_daily,6),20))) then return; end if;
  select p.id into v_id from posts p join threads_promotion_permissions c on c.post_id=p.id
    left join threads_promotion_jobs j on j.post_id=p.id
    where p.status='active' and not p.is_seed and p.published_at >= p_since
      and (p.expires_at is null or p.expires_at>now())
      and c.author_id=p.author_id and c.consent_at is not null and not c.excluded
      and c.approved_hash=threads_source_hash(p)
      and (j.post_id is null or (j.status='retry' and j.attempts<3 and j.next_attempt_at<=now() and j.publish_started_at is null))
    order by p.published_at,p.id limit 1 for update of p skip locked;
  if v_id is null then return; end if;
  insert into threads_promotion_jobs(post_id,status,lease,source_hash)
    select p.id,'processing',v_lease,threads_source_hash(p) from posts p where p.id=v_id
  on conflict on constraint threads_promotion_jobs_pkey do update
    set status='processing',lease=v_lease,source_hash=excluded.source_hash,
      claimed_at=now(),attempts=threads_promotion_jobs.attempts+1;
  return query select p.id,p.title,p.short_description,p.description,v_lease,threads_source_hash(p),s.use_ai
    from posts p where p.id=v_id;
end $$;

-- Durable write BEFORE the only externally visible side effect. Compare-and-set lease,
-- fresh consent/content/status checks, and kill switch. False/unknown => DO NOT publish.
create function public.threads_prepare_publish(p_post_id bigint,p_lease uuid,p_container text,p_draft text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  perform 1 from threads_promotion_settings where id and enabled for update;
  if not found then return false; end if;
  update threads_promotion_jobs j set status='publishing',container_id=p_container,
    draft_text=p_draft,publish_started_at=now()
  from posts p,threads_promotion_permissions c
  where j.post_id=p_post_id and j.lease=p_lease and j.status='processing'
    and p.id=j.post_id and c.post_id=p.id and p.status='active' and not p.is_seed
    and (p.expires_at is null or p.expires_at>now())
    and c.author_id=p.author_id and c.consent_at is not null and not c.excluded
    and c.approved_hash=threads_source_hash(p) and j.source_hash=c.approved_hash;
  return found;
end $$;

create function public.threads_complete(p_post_id bigint,p_lease uuid,p_status text,
  p_error text default null,p_threads_id text default null,p_url text default null)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if p_status not in ('published','review','retry','blocked') then raise exception 'invalid status'; end if;
  update threads_promotion_jobs j set status=case when p_status='retry' and attempts>=3 then 'review' else p_status end,
    error_message=left(p_error,80),threads_id=coalesce(p_threads_id,j.threads_id),
    threads_url=coalesce(p_url,j.threads_url),
    published_at=case when p_status='published' then now() else j.published_at end,
    next_attempt_at=now()+interval '10 minutes' * attempts
  where j.post_id=p_post_id and j.lease=p_lease and j.status in ('processing','publishing')
    and (p_status <> 'retry' or j.publish_started_at is null);
  return found;
end $$;

create function public.threads_retry(p_post_id bigint) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  -- Never reset a publishing marker, including an uncertain network/DB result.
  update threads_promotion_jobs set status='retry',next_attempt_at=now(),attempts=0
    where post_id=p_post_id and status in ('retry','review','blocked')
      and publish_started_at is null and threads_id is null and lease is not null;
  return found;
end $$;

-- Superseded insecure/non-fenced finalizer cannot be used by the Worker.
revoke execute on function public.threads_finish_job(bigint,text,text,text,text) from service_role;
revoke all on function public.threads_source_hash(public.posts),public.threads_consent(bigint,uuid,boolean),
 public.threads_moderate(bigint,uuid,text,boolean),public.threads_claim_one(timestamptz,integer),
 public.threads_prepare_publish(bigint,uuid,text,text),public.threads_complete(bigint,uuid,text,text,text,text),
 public.threads_retry(bigint) from public,anon,authenticated;
grant execute on function public.threads_source_hash(public.posts),public.threads_consent(bigint,uuid,boolean),
 public.threads_moderate(bigint,uuid,text,boolean),public.threads_claim_one(timestamptz,integer),
 public.threads_prepare_publish(bigint,uuid,text,text),public.threads_complete(bigint,uuid,text,text,text,text),
 public.threads_retry(bigint) to service_role;
commit;
