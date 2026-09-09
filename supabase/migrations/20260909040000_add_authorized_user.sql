drop policy "approved owner manages member settings" on public.member_settings;
drop policy "approved owner manages scheduling rules" on public.scheduling_rules;
drop policy "approved owner manages drafts" on public.schedule_drafts;
drop policy "approved owner manages assignments" on public.draft_assignments;
drop policy "approved owner manages required pairs" on public.required_pair_rules;
drop policy "Owner can manage weekly instrument requirements" on public.weekly_instrument_requirements;

create policy "approved users manage member settings" on public.member_settings for all
using (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'))
with check (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'));

create policy "approved users manage scheduling rules" on public.scheduling_rules for all
using (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'))
with check (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'));

create policy "approved users manage drafts" on public.schedule_drafts for all
using (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'))
with check (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'));

create policy "approved users manage assignments" on public.draft_assignments for all
using (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'))
with check (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'));

create policy "approved users manage required pairs" on public.required_pair_rules for all
using (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'))
with check (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'));

create policy "approved users manage weekly instrument requirements" on public.weekly_instrument_requirements for all to authenticated
using (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'))
with check (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'));
