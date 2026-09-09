alter table public.member_settings
add column minimum_weeks_between integer not null default 2
check (minimum_weeks_between between 1 and 13);
