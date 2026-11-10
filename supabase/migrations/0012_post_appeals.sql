-- Additive migration. No existing post data is backfilled or changed.
-- Apply only after operator approval. All calls are server-only after auth checks.
create table if not exists public.post_appeals (
  post_id bigint primary key references public.posts(id) on delete cascade,
  reason text not null default '내부 운영정책에 의한 숨김 및 차단',
  state text not null default 'restricted' check (state in ('restricted','pending','revision','pdf_requested','approved','rejected')),
  appeal text not null default '',
  response text not null default '',
  version integer not null default 1,
  events jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.post_appeals enable row level security;
revoke all on public.post_appeals from public, anon, authenticated;
grant all on public.post_appeals to service_role;

create or replace function public.post_appeal_transition(
  p_post bigint, p_actor uuid, p_action text, p_text text,
  p_version integer default null, p_source_updated timestamptz default null
) returns void language plpgsql security definer set search_path = public as $$
declare src public.posts%rowtype; item public.post_appeals%rowtype; next_state text;
begin
  select * into src from public.posts where id=p_post for update;
  if not found or src.status='deleted' then raise exception 'POST_UNAVAILABLE'; end if;
  select * into item from public.post_appeals where post_id=p_post for update;
  if p_action='submit' then
    if src.author_id is distinct from p_actor or src.status not in ('hidden','blocked') then raise exception 'NOT_OWNER_OR_RESTRICTED'; end if;
    if coalesce(item.version,0) is distinct from p_version then raise exception 'STALE_REVIEW'; end if;
    if item.state='pending' then raise exception 'ALREADY_PENDING'; end if;
    if item.state in ('pdf_requested','rejected') then raise exception 'SECOND_STAGE_EMAIL_ONLY'; end if;
    if char_length(trim(p_text)) not between 30 and 5000 then raise exception 'INVALID_APPEAL_LENGTH'; end if;
    next_state := 'pending';
  elsif p_action='restore' then
    next_state := 'approved';
  elsif p_action in ('hidden','blocked') then
    if char_length(trim(p_text)) not between 1 and 2000 then raise exception 'INVALID_REASON'; end if;
    next_state := 'restricted';
  elsif p_action in ('approve','revision','pdf_requested','reject') then
    if item.post_id is null or item.version is distinct from p_version then raise exception 'STALE_REVIEW'; end if;
    if src.status not in ('hidden','blocked') then raise exception 'NOT_RESTRICTED'; end if;
    if p_action='approve' then
      if item.state not in ('pending','pdf_requested','rejected') then raise exception 'NOT_REVIEWABLE'; end if;
      if p_source_updated is null or src.updated_at is distinct from p_source_updated then raise exception 'SOURCE_CHANGED'; end if;
      next_state := 'approved';
    else
      if item.state not in ('pending','pdf_requested','rejected') then raise exception 'NOT_REVIEWABLE'; end if;
      if char_length(trim(p_text)) not between 1 and 2000 then raise exception 'INVALID_RESPONSE'; end if;
      next_state := case when p_action='reject' then 'rejected' else p_action end;
    end if;
  else raise exception 'INVALID_ACTION'; end if;

  insert into public.post_appeals(post_id) values(p_post) on conflict do nothing;
  update public.post_appeals set
    state=next_state,
    reason=case when p_action in ('hidden','blocked') then trim(p_text) else reason end,
    appeal=case when p_action='submit' then trim(p_text) when p_action in ('hidden','blocked') then '' else appeal end,
    response=case when p_action='restore' then '관리자가 직접 복원했습니다.' when p_action in ('approve','revision','pdf_requested','reject') then trim(coalesce(p_text,'')) when p_action in ('hidden','blocked','submit') then '' else response end,
    version=coalesce(item.version,0)+1,
    updated_at=now(),
    events=events || jsonb_build_array(jsonb_build_object('at',now(),'actor',p_actor,'action',p_action,'text',p_text))
  where post_id=p_post;
  if p_action in ('hidden','blocked','approve','restore') then
    update public.posts set status=case when p_action in ('approve','restore') then 'active' else p_action end, updated_at=now() where id=p_post;
  end if;
end $$;
revoke all on function public.post_appeal_transition(bigint,uuid,text,text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.post_appeal_transition(bigint,uuid,text,text,integer,timestamptz) to service_role;
