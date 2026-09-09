drop policy "owners manage member settings" on public.member_settings;
drop policy "owners manage scheduling rules" on public.scheduling_rules;
drop policy "owners manage drafts" on public.schedule_drafts;
drop policy "owners manage assignments" on public.draft_assignments;
drop policy "owners manage required pairs" on public.required_pair_rules;

create policy "approved owner manages member settings"
on public.member_settings for all
using (auth.uid() = owner_id and lower(auth.jwt() ->> 'email') = 'samwolcott@gmail.com')
with check (auth.uid() = owner_id and lower(auth.jwt() ->> 'email') = 'samwolcott@gmail.com');

create policy "approved owner manages scheduling rules"
on public.scheduling_rules for all
using (auth.uid() = owner_id and lower(auth.jwt() ->> 'email') = 'samwolcott@gmail.com')
with check (auth.uid() = owner_id and lower(auth.jwt() ->> 'email') = 'samwolcott@gmail.com');

create policy "approved owner manages drafts"
on public.schedule_drafts for all
using (auth.uid() = owner_id and lower(auth.jwt() ->> 'email') = 'samwolcott@gmail.com')
with check (auth.uid() = owner_id and lower(auth.jwt() ->> 'email') = 'samwolcott@gmail.com');

create policy "approved owner manages assignments"
on public.draft_assignments for all
using (auth.uid() = owner_id and lower(auth.jwt() ->> 'email') = 'samwolcott@gmail.com')
with check (auth.uid() = owner_id and lower(auth.jwt() ->> 'email') = 'samwolcott@gmail.com');

create policy "approved owner manages required pairs"
on public.required_pair_rules for all
using (auth.uid() = owner_id and lower(auth.jwt() ->> 'email') = 'samwolcott@gmail.com')
with check (auth.uid() = owner_id and lower(auth.jwt() ->> 'email') = 'samwolcott@gmail.com');
