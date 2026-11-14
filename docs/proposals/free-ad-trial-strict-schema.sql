-- Prepare only: apply explicitly before deploying the free-trial application code.
-- A successful application consumes one trial across all three ad types.
-- Ledger intentionally survives deleting/rejecting an ad or post.
begin;
alter table public.hero_ads add column if not exists post_id bigint;
alter table public.hero_ads add column if not exists free_trial boolean not null default false;
alter table public.ads add column if not exists free_trial boolean not null default false;
create table if not exists public.free_ad_trials (
  user_id uuid primary key,
  post_id bigint not null unique,
  ad_kind text not null,
  created_at timestamptz not null default now()
);
alter table public.free_ad_trials enable row level security;
revoke all on public.free_ad_trials from public, anon, authenticated;
grant select, insert on public.free_ad_trials to service_role;
create or replace function public.enforce_free_ad_trial() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Explicit administrator assignments without a requester are not public trials.
  if not new.free_trial then return new; end if;
  if new.requested_by is null then raise exception 'FREE_AD_USER_REQUIRED'; end if;
  if new.post_id is null or not exists (
    select 1 from public.posts where id = new.post_id and author_id = new.requested_by and status = 'active'
  ) then raise exception 'FREE_AD_POST_REQUIRED'; end if;
  new.plan := 'week';
  insert into public.free_ad_trials(user_id, post_id, ad_kind)
    values(new.requested_by, new.post_id, TG_TABLE_NAME);
  return new;
exception when unique_violation then
  raise exception 'FREE_AD_TRIAL_USED';
end;
$$;
revoke all on function public.enforce_free_ad_trial() from public, anon, authenticated;
create trigger ads_free_trial before insert on public.ads
  for each row execute function public.enforce_free_ad_trial();
create trigger hero_ads_free_trial before insert on public.hero_ads
  for each row execute function public.enforce_free_ad_trial();
create or replace function public.protect_free_ad_period() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.free_trial then
    new.free_trial := true;
    new.plan := 'week';
    if old.status = 'active' and (new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at) then
      raise exception 'FREE_AD_EXTENSION_NOT_ALLOWED';
    end if;
    if old.status = 'requested' and new.status = 'active' then
      new.ends_at := new.starts_at + interval '7 days';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.protect_free_ad_period() from public, anon, authenticated;
create trigger ads_free_period before update on public.ads for each row execute function public.protect_free_ad_period();
create trigger hero_ads_free_period before update on public.hero_ads for each row execute function public.protect_free_ad_period();
-- Serialize approvals so concurrent administrators cannot exceed capacity.
create or replace function public.approve_hero_ad(p_id bigint, p_capacity integer) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ad public.hero_ads; t timestamptz := now();
begin
  if p_capacity not between 1 and 10 then raise exception 'INVALID_HERO_CAPACITY'; end if;
  lock table public.hero_ads in share row exclusive mode;
  select * into ad from public.hero_ads where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', '신청을 찾을 수 없어요.'); end if;
  if ad.status = 'active' then return jsonb_build_object('ok', true); end if;
  if (select count(*) from public.hero_ads where status='active' and starts_at <= t and ends_at > t) >= p_capacity then
    return jsonb_build_object('ok', false, 'error', '슬라이드 자리가 모두 차 있어요. 기존 광고 종료 후 승인해주세요.');
  end if;
  update public.hero_ads set status='active', starts_at=t,
    ends_at=t + (case when ad.free_trial or ad.plan='week' then interval '7 days' else interval '30 days' end)
    where id=p_id;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.approve_hero_ad(bigint, integer) from public, anon, authenticated;
grant execute on function public.approve_hero_ad(bigint, integer) to service_role;
commit;
