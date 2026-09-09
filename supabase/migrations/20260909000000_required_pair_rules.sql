create table public.required_pair_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  person_one_id text not null,
  person_two_id text not null,
  created_at timestamptz not null default now(),
  check (person_one_id < person_two_id),
  unique (owner_id, person_one_id, person_two_id)
);

alter table public.required_pair_rules enable row level security;

create policy "owners manage required pairs"
on public.required_pair_rules
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);
