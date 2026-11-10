-- Member discussion is separate from the operator's /community guides.
-- All writes/reads are server-only; server actions derive identity from verified sessions.
begin;
create table public.member_posts (
 id bigint generated always as identity primary key,
 author_id uuid references public.profiles(id) on delete set null,
 nickname text not null,
 payload jsonb not null,
 status text not null default 'active' check(status in ('active','hidden','deleted')),
 closed boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(payload ?& array['title','body','category','purpose']),
 check(payload->>'category' in ('app','web','game','shop','food','cosmetics','fragrance','clothing','product','other')),
 check(payload->>'purpose' in ('test','experience','feedback','review','mutual','discussion')),
 check(char_length(payload->>'title') between 2 and 100),
 check(char_length(payload->>'body') between 2 and 10000)
);
create index member_posts_list on public.member_posts(status,created_at desc,id desc);
create index member_posts_author on public.member_posts(author_id,created_at desc);
create table public.member_comments (
 id bigint generated always as identity primary key,
 post_id bigint not null references public.member_posts(id) on delete cascade,
 author_id uuid references public.profiles(id) on delete set null,
 nickname text not null, parent_id bigint references public.member_comments(id),
 body text not null check(char_length(body)<=3000),
 status text not null default 'active' check(status in ('active','deleted')),
 created_at timestamptz not null default now()
);
create index member_comments_thread on public.member_comments(post_id,created_at,id);
create table public.member_notifications (
 id bigint generated always as identity primary key,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 post_id bigint not null references public.member_posts(id) on delete cascade,
 comment_id bigint not null references public.member_comments(id) on delete cascade,
 kind text not null check(kind in ('comment','reply')),
 is_read boolean not null default false,created_at timestamptz not null default now(),
 unique(recipient_id,comment_id)
);
create index member_notifications_inbox on public.member_notifications(recipient_id,is_read,id desc);
create table public.member_reports (
 id bigint generated always as identity primary key,
 post_id bigint not null references public.member_posts(id) on delete cascade,
 comment_id bigint references public.member_comments(id) on delete cascade,
 reporter_id uuid not null references public.profiles(id) on delete cascade,
 reason text not null check(char_length(reason) between 2 and 1000),created_at timestamptz not null default now()
);
alter table public.member_posts enable row level security;
alter table public.member_comments enable row level security;
alter table public.member_notifications enable row level security;
alter table public.member_reports enable row level security;
revoke all on public.member_posts,public.member_comments,public.member_notifications,public.member_reports from anon,authenticated;
grant all on public.member_posts,public.member_comments,public.member_notifications,public.member_reports to service_role;
grant usage,select on sequence public.member_posts_id_seq,public.member_comments_id_seq,public.member_notifications_id_seq,public.member_reports_id_seq to service_role;
-- Atomic write: a comment cannot succeed while silently losing its notification.
create function public.member_add_comment(p_post_id bigint,p_author_id uuid,p_nickname text,p_body text,p_parent_id bigint default null)
returns bigint language plpgsql security invoker set search_path=public as $$
declare owner_id uuid; reply_owner uuid; new_id bigint;
begin
 perform 1 from public.profiles where id=p_author_id and status='active' for no key update;
 if not found then raise exception 'Account unavailable'; end if;
 select author_id into owner_id from public.member_posts where id=p_post_id and status='active' for update;
 if not found then raise exception 'Post unavailable'; end if;
 if (select count(*) from public.member_comments where post_id=p_post_id)>=1000 then raise exception 'Comment limit reached'; end if;
 if char_length(trim(p_body)) not between 1 and 3000 then raise exception 'Invalid comment'; end if;
 if exists(select 1 from public.profiles where id=p_author_id and status='blocked') then raise exception 'Blocked account'; end if;
 if (select count(*) from public.member_comments where author_id=p_author_id and created_at>now()-interval '1 minute')>=15 then raise exception 'Too many comments'; end if;
 if p_parent_id is not null then
  select author_id into reply_owner from public.member_comments where id=p_parent_id and post_id=p_post_id and parent_id is null and status='active';
  if not found then raise exception 'Invalid reply target'; end if;
 end if;
 insert into public.member_comments(post_id,author_id,nickname,body,parent_id) values(p_post_id,p_author_id,p_nickname,p_body,p_parent_id) returning id into new_id;
 if owner_id is not null and owner_id<>p_author_id then
  insert into public.member_notifications(recipient_id,post_id,comment_id,kind) values(owner_id,p_post_id,new_id,'comment');
 end if;
 if reply_owner is not null and reply_owner<>p_author_id then
  insert into public.member_notifications(recipient_id,post_id,comment_id,kind) values(reply_owner,p_post_id,new_id,'reply') on conflict(recipient_id,comment_id) do update set kind='reply';
 end if;
 return new_id;
end;$$;
revoke all on function public.member_add_comment(bigint,uuid,text,text,bigint) from public,anon,authenticated;
grant execute on function public.member_add_comment(bigint,uuid,text,text,bigint) to service_role;
-- Durable limits complement per-instance application throttling.
create function public.member_guard_insert() returns trigger language plpgsql security invoker set search_path=public as $$
declare actor_id uuid; recent bigint;
begin
 actor_id := case when TG_TABLE_NAME='member_posts' then (to_jsonb(NEW)->>'author_id')::uuid else (to_jsonb(NEW)->>'reporter_id')::uuid end;
 perform 1 from public.profiles where id=actor_id and status='active' for no key update;
 if not found then raise exception 'Account unavailable'; end if;
 if TG_TABLE_NAME='member_posts' then
  select count(*) into recent from public.member_posts where author_id=actor_id and created_at>now()-interval '10 minutes';
 else
  select count(*) into recent from public.member_reports where reporter_id=actor_id and created_at>now()-interval '10 minutes';
 end if;
 if recent>=5 then raise exception 'Too many requests'; end if;
 return NEW;
end;$$;
revoke all on function public.member_guard_insert() from public,anon,authenticated;
grant execute on function public.member_guard_insert() to service_role;
create trigger member_post_insert_guard before insert on public.member_posts for each row execute function public.member_guard_insert();
create trigger member_report_insert_guard before insert on public.member_reports for each row execute function public.member_guard_insert();
-- Private applications: no addresses, emails, or phone numbers are collected.
create table public.member_applications (
 id bigint generated always as identity primary key,
 post_id bigint not null references public.member_posts(id) on delete cascade,
 applicant_id uuid not null references public.profiles(id) on delete cascade,
 nickname text not null, note text not null default '' check(char_length(note)<=1000),
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(),
 unique(post_id,applicant_id)
);
alter table public.member_applications enable row level security;
revoke all on public.member_applications from anon,authenticated;
grant all on public.member_applications to service_role;
grant usage,select on sequence public.member_applications_id_seq to service_role;
create index member_applications_user on public.member_applications(applicant_id,created_at desc);
create function public.member_apply(p_post_id bigint,p_applicant_id uuid,p_nickname text,p_note text)
returns bigint language plpgsql security invoker set search_path=public as $$
declare owner_id uuid; new_id bigint;
begin
 perform 1 from public.profiles where id=p_applicant_id and status='active' for no key update;
 if not found then raise exception 'Account unavailable'; end if;
 select author_id into owner_id from public.member_posts where id=p_post_id and status='active' and closed=false and payload->'details'->>'acceptApplications'='true' for update;
 if not found or owner_id=p_applicant_id then raise exception 'Application unavailable'; end if;
 if char_length(p_note)>1000 then raise exception 'Invalid note'; end if;
 if (select count(*) from public.member_applications where applicant_id=p_applicant_id and created_at>now()-interval '10 minutes')>=5 then raise exception 'Too many applications'; end if;
 insert into public.member_applications(post_id,applicant_id,nickname,note) values(p_post_id,p_applicant_id,p_nickname,p_note)
 on conflict(post_id,applicant_id) do update set note=excluded.note,nickname=excluded.nickname,status='pending',created_at=now() where member_applications.status='cancelled'
 returning id into new_id;
 if new_id is null then raise exception 'Already applied'; end if;
 return new_id;
end;$$;
revoke all on function public.member_apply(bigint,uuid,text,text) from public,anon,authenticated;
grant execute on function public.member_apply(bigint,uuid,text,text) to service_role;
commit;
