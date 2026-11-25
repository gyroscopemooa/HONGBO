-- Move legacy standalone listings into services without deleting posts or changing IDs.
-- The updated app also reads legacy rows during rollout.
begin;
update public.posts
set category = 'services',
    extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('serviceField', case category
      when 'photography' then 'photography'
      when 'psych-test' then 'psychology'
      when 'counseling' then 'psychology'
      when 'occupational-therapy' then 'therapy'
    end)
where category in ('photography','psych-test','counseling','occupational-therapy');
commit;
