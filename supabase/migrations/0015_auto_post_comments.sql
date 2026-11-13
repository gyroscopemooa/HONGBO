begin;
create table public.auto_comment_settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 start_at timestamptz not null default now(), daily_limit integer not null default 50 check(daily_limit between 1 and 50)
);
insert into public.auto_comment_settings(id) values(true);
create table public.auto_comment_attempts (
 post_id bigint primary key references public.posts(id) on delete cascade,
 claimed_at timestamptz not null default now(), source_hash text not null,
 status text not null default 'claimed' check(status in ('claimed','posted','skipped')),
 comment_id bigint references public.post_comments(id) on delete set null
);
create table public.auto_comment_daily_budget (day date primary key, attempts integer not null default 0);
alter table public.auto_comment_settings enable row level security;
alter table public.auto_comment_attempts enable row level security;
alter table public.auto_comment_daily_budget enable row level security;
revoke all on public.auto_comment_settings,public.auto_comment_attempts,public.auto_comment_daily_budget from public,anon,authenticated;
grant all on public.auto_comment_settings,public.auto_comment_attempts,public.auto_comment_daily_budget to service_role;
create function public.claim_auto_comment() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.auto_comment_settings; p public.posts; n integer; d date := (now() at time zone 'UTC')::date;
begin
 select * into s from public.auto_comment_settings where id for update;
 if not found or not s.enabled then return null; end if;
 insert into public.auto_comment_daily_budget(day) values(d) on conflict do nothing;
 select attempts into n from public.auto_comment_daily_budget where day=d;
 if n >= s.daily_limit then return null; end if;
 select posts.* into p from public.posts posts join public.profiles u on u.id=posts.author_id
 where posts.status='active' and u.status='active' and not posts.is_seed
 and posts.published_at >= s.start_at and posts.published_at <= now()-interval '10 minutes'
 and (posts.expires_at is null or posts.expires_at > now())
 and not exists(select 1 from public.auto_comment_attempts a where a.post_id=posts.id)
 order by posts.published_at,posts.id limit 1 for update of posts skip locked;
 if not found then return null; end if;
 insert into public.auto_comment_attempts(post_id,source_hash) values(p.id,md5(concat_ws('|',p.title,p.short_description,p.description)));
 update public.auto_comment_daily_budget set attempts=attempts+1 where day=d;
 return jsonb_build_object('id',p.id,'title',p.title,'short_description',p.short_description,'description',p.description);
end $$;
create function public.finish_auto_comment(p_post_id bigint,p_body text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.auto_comment_settings; p public.posts; a public.auto_comment_attempts; c bigint;
begin
 select * into s from public.auto_comment_settings where id for update;
 select * into p from public.posts where id=p_post_id for update;
 select * into a from public.auto_comment_attempts where post_id=p_post_id for update;
 if not found or a.status <> 'claimed' then return false; end if;
 if not s.enabled or p.id is null or p.status<>'active' or p.is_seed
 or not exists(select 1 from public.profiles where id=p.author_id and status='active')
 or (p.expires_at is not null and p.expires_at<=now())
 or a.claimed_at < now()-interval '5 minutes'
 or a.source_hash<>md5(concat_ws('|',p.title,p.short_description,p.description))
 or p_body is null or char_length(btrim(p_body)) not between 8 and 240 then
 update public.auto_comment_attempts set status='skipped' where post_id=p_post_id; return false;
 end if;
 insert into public.post_comments(post_id,author_id,nickname,body) values(p.id,null,'홍보회원 2455',btrim(p_body)) returning id into c;
 update public.auto_comment_attempts set status='posted',comment_id=c where post_id=p_post_id;
 return true;
end $$;
revoke all on function public.claim_auto_comment(),public.finish_auto_comment(bigint,text) from public,anon,authenticated;
grant execute on function public.claim_auto_comment(),public.finish_auto_comment(bigint,text) to service_role;
commit;
