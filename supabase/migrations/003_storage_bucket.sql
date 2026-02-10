-- ============================================
-- Migración 003: Storage bucket para fotos
-- ============================================

-- Crear bucket para fotos de hábitos
insert into storage.buckets (id, name, public)
values ('habit-photos', 'habit-photos', false);

-- Política: cualquiera puede subir fotos (anon key)
create policy "habit_photos_insert"
  on storage.objects for insert
  with check (bucket_id = 'habit-photos');

-- Política: cualquiera puede ver fotos (anon key)
create policy "habit_photos_select"
  on storage.objects for select
  using (bucket_id = 'habit-photos');
