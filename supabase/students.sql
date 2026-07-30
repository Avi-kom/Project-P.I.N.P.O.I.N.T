-- Run this once in the Supabase dashboard: Project > SQL Editor > New Query > paste > Run.
--
-- Gives each student a password so a returning email must prove it's really them
-- on a new device (stops impersonation by typing someone's email/name/section).
-- Passwords are hashed with bcrypt (pgcrypto) and NEVER leave the server: the
-- table is locked (no anon read/write) and the app only calls the SECURITY
-- DEFINER functions below.

create extension if not exists pgcrypto;

create table if not exists public.students (
  email text primary key,
  name text not null,
  section text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.students enable row level security;
-- No policies on purpose: the anon key cannot read or write this table directly.
-- All access goes through the security-definer functions granted below.

-- Has this email already registered?
create or replace function public.student_exists(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.students where email = lower(trim(p_email)));
$$;

-- Register a new student. Returns 'created', or 'exists' if the email is taken.
create or replace function public.register_student(
  p_email text,
  p_name text,
  p_section text,
  p_password text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if exists (select 1 from public.students where email = v_email) then
    return 'exists';
  end if;
  insert into public.students (email, name, section, password_hash)
  values (v_email, p_name, p_section, crypt(p_password, gen_salt('bf')));
  return 'created';
end;
$$;

-- Verify a login. Returns the student's name/section on a correct password,
-- otherwise no rows.
create or replace function public.verify_student(p_email text, p_password text)
returns table (name text, section text)
language sql
security definer
set search_path = public
as $$
  select s.name, s.section
  from public.students s
  where s.email = lower(trim(p_email))
    and s.password_hash = crypt(p_password, s.password_hash);
$$;

grant execute on function public.student_exists(text) to anon;
grant execute on function public.register_student(text, text, text, text) to anon;
grant execute on function public.verify_student(text, text) to anon;
