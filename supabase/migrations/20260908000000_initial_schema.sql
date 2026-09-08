create extension if not exists pgcrypto;

create table public.member_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  planning_center_person_id text not null,
  skill_level text check (skill_level in ('A', 'B', 'C')),
  private_notes text not null default '',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, planning_center_person_id),
  check (not active or skill_level is not null)
);

create table public.scheduling_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade unique,
  configuration jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.schedule_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.draft_assignments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  draft_id uuid not null references public.schedule_drafts(id) on delete cascade,
  planning_center_plan_id text not null,
  planning_center_person_id text not null,
  planning_center_team_id text not null,
  position_name text not null,
  manually_selected boolean not null default false,
  planning_center_plan_person_id text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (draft_id, planning_center_plan_id, planning_center_person_id, position_name)
);

alter table public.member_settings enable row level security;
alter table public.scheduling_rules enable row level security;
alter table public.schedule_drafts enable row level security;
alter table public.draft_assignments enable row level security;

create policy "owners manage member settings" on public.member_settings for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage scheduling rules" on public.scheduling_rules for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage drafts" on public.schedule_drafts for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage assignments" on public.draft_assignments for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
