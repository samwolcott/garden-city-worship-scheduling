update public.member_settings
set minimum_weeks_between = 1,
    updated_at = now()
where schedule_every_sunday = true;
