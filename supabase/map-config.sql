-- Stores the campus map layout (tap-areas) and freehand line edits so the Map
-- Editor can Save on the deployed site (Vercel's filesystem is read-only, so
-- writing the source file only works in local dev). One row, id = 'default'.
create table if not exists public.map_config (
  id text primary key,
  zones jsonb not null,
  annotations jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.map_config enable row level security;

-- Prototype policies: open read + write (matches the pins/feedback tables).
-- Tighten with real auth before production use.
drop policy if exists "map_config read" on public.map_config;
create policy "map_config read" on public.map_config
  for select using (true);

drop policy if exists "map_config insert" on public.map_config;
create policy "map_config insert" on public.map_config
  for insert with check (true);

drop policy if exists "map_config update" on public.map_config;
create policy "map_config update" on public.map_config
  for update using (true) with check (true);
