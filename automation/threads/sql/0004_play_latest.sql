-- Apply after 0003. Only replaces selection order; no settings or posts are changed.
-- Existing function signature and EXECUTE privileges are preserved.
begin;
create or replace function public.threads_claim_one(p_since timestamptz,p_max_daily integer default 6)
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
    -- Least recently reserved category first; empty categories never stall the queue.
    -- Count all reservation outcomes, so failures cannot monopolize one category.
    order by coalesce((
      select max(h.claimed_at) from threads_promotion_jobs h
      join posts hp on hp.id=h.post_id
      where hp.category is not distinct from p.category
    ), '-infinity'::timestamptz),
    case when coalesce(to_jsonb(p)->'tags', '[]'::jsonb) ? '놀러가자' then p.published_at end desc nulls last,
    case when coalesce(to_jsonb(p)->'tags', '[]'::jsonb) ? '놀러가자' then p.id end desc nulls last,
    p.published_at,p.id
    limit 1 for update of p skip locked;
  if v_id is null then return; end if;
  insert into threads_promotion_jobs(post_id,status,lease,source_hash)
    select p.id,'processing',v_lease,threads_source_hash(p) from posts p where p.id=v_id
  on conflict on constraint threads_promotion_jobs_pkey do update
    set status='processing',lease=v_lease,source_hash=excluded.source_hash,
      claimed_at=now(),attempts=threads_promotion_jobs.attempts+1;
  return query select p.id,p.title,p.short_description,p.description,v_lease,threads_source_hash(p),s.use_ai
    from posts p where p.id=v_id;
end $$;

commit;
