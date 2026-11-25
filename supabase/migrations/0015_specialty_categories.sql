-- Add independent photography, psychological assessment, counseling and occupational therapy listings.
-- Apply before deploying the new category writer.
begin;
alter table public.posts drop constraint if exists posts_category_check;
alter table public.posts add constraint posts_category_check
  check (category in ('apps','websites','services','offline','products','content','events','free','quick','photography','psych-test','counseling','occupational-therapy'));
commit;
