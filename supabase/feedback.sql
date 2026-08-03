-- Run this once in the Supabase dashboard: Project > SQL Editor > New Query > paste > Run.
-- Stores improvement feedback submitted by students and staff.

create table if not exists public.feedback (
  id text primary key,
  message text not null,
  role text not null check (role in ('student', 'admin')),
  name text not null default 'Anonymous',
  email text not null default 'unknown',
  created_at timestamptz not null default now()
);

-- Device id of the submitter's browser (a clue for spotting repeat trolls).
alter table public.feedback add column if not exists device_id text;

alter table public.feedback enable row level security;

-- Prototype-only policies: anyone with the anon key can submit and read.
-- Tighten (e.g. restrict reads to admins) once real auth exists.
create policy "Public read feedback" on public.feedback
  for select using (true);

create policy "Public insert feedback" on public.feedback
  for insert with check (true);
