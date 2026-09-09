create table public.default_instrument_requirements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  planning_center_team_id text not null,
  planning_center_team_position_id text not null,
  position_name text not null,
  required_count integer not null check (required_count between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, planning_center_team_id, planning_center_team_position_id)
);

alter table public.default_instrument_requirements enable row level security;

create policy "approved users manage default instrument requirements" on public.default_instrument_requirements for all to authenticated
using (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'))
with check (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'));

alter table public.weekly_instrument_requirements
drop constraint if exists weekly_instrument_requirements_required_count_check;

alter table public.weekly_instrument_requirements
add constraint weekly_instrument_requirements_required_count_check check (required_count between 0 and 20);
