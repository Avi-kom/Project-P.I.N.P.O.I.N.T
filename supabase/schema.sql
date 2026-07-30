-- Run this once in the Supabase dashboard: Project > SQL Editor > New Query > paste > Run.

create table if not exists public.pins (
  id text primary key,
  floor_id smallint not null check (floor_id between 1 and 4),
  x_coord numeric not null,
  y_coord numeric not null,
  level text not null check (level in ('1', '2', '3', 'Fixed')),
  description text not null,
  photo_url text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  building text not null,
  reporter_name text not null,
  reporter_section text not null,
  reporter_email text not null,
  exact_location text,
  created_at timestamptz not null default now()
);

-- If the pins table already existed before this column was added, run this too:
alter table public.pins add column if not exists exact_location text;

alter table public.pins enable row level security;

-- Prototype-only policies: no real backend auth exists yet, so anyone with
-- the public anon key can read/write. Tighten these once real auth is added
-- (e.g. restrict status updates to a verified admin role).
create policy "Public read access" on public.pins
  for select using (true);

create policy "Public insert access" on public.pins
  for insert with check (true);

create policy "Public update access" on public.pins
  for update using (true);
