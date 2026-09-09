create table public.weekly_instrument_requirements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  service_date date not null,
  planning_center_team_id text not null,
  planning_center_team_position_id text not null,
  position_name text not null,
  required_count integer not null check (required_count between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, service_date, planning_center_team_id, planning_center_team_position_id)
);

alter table public.weekly_instrument_requirements enable row level security;

create policy "Owner can manage weekly instrument requirements"
on public.weekly_instrument_requirements
for all
to authenticated
using (owner_id = auth.uid() and auth.jwt() ->> 'email' = 'samwolcott@gmail.com')
with check (owner_id = auth.uid() and auth.jwt() ->> 'email' = 'samwolcott@gmail.com');

