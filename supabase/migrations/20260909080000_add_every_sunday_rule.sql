alter table public.member_settings
add column schedule_every_sunday boolean not null default false;
