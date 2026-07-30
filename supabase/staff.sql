-- Run this once in the Supabase dashboard: Project > SQL Editor > New Query > paste > Run.
--
-- Staff registry for the unified sign-in. There is no separate admin login: a
-- person becomes staff by signing in with their email and the admin PIN in the
-- password box. That call registers their email here, and afterward they can
-- reach the admin panel with either the PIN or their own password.
--
-- The PIN is checked INSIDE register_staff so a student can't just call the API
-- to make themselves staff. Keep the code below in sync with ADMIN_PIN in
-- src/lib/admin-auth.ts.

create table if not exists public.staff (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;
-- No policies: the anon key can't read/write this table directly; only the
-- security-definer functions below touch it.

-- Is this email a registered staff account?
create or replace function public.is_staff(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where email = lower(trim(p_email)));
$$;

-- Register an email as staff — only when the correct PIN/code is supplied.
create or replace function public.register_staff(p_email text, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_code is distinct from '0713' then
    return false;
  end if;
  insert into public.staff (email)
  values (lower(trim(p_email)))
  on conflict (email) do nothing;
  return true;
end;
$$;

grant execute on function public.is_staff(text) to anon;
grant execute on function public.register_staff(text, text) to anon;
