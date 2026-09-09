create table public.team_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  planning_center_team_id text not null,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, planning_center_team_id)
);

alter table public.team_settings enable row level security;

create policy "approved users manage team settings" on public.team_settings for all to authenticated
using (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'))
with check (lower(auth.jwt() ->> 'email') in ('samwolcott@gmail.com', 'michael@gardencitynw.com'));
