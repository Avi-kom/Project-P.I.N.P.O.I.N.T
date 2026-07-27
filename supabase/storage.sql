-- Run this once in the Supabase dashboard: Project > SQL Editor > New Query > paste > Run.
-- Creates a public bucket for report photos and allows public upload/read.
-- (Prototype-only policies — anyone with the anon key can upload/read. Tighten
--  these once real auth is added.)

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

create policy "Public read report photos"
  on storage.objects for select
  using (bucket_id = 'report-photos');

create policy "Public upload report photos"
  on storage.objects for insert
  with check (bucket_id = 'report-photos');
