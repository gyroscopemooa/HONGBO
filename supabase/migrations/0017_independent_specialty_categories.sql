-- Keep original post IDs, data, and links; never guess the kind of an old merged psychology listing.
begin;
update public.posts
set category = extra->>'serviceField'
where category = 'services'
  and extra->>'serviceField' in ('photography','psych-test','counseling');
-- Direct legacy categories remain independent; synchronize their JSON field.
update public.posts
set extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('serviceField', category)
where category in ('photography','psych-test','counseling')
  and (extra->>'serviceField') is distinct from category;
commit;
