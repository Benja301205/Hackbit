-- ============================================
-- Migración 002: Row Level Security
-- ============================================
-- Como no hay auth de Supabase (la identidad es por session_token en localStorage),
-- habilitamos RLS pero con políticas permisivas para el anon key.
-- La seguridad real se maneja a nivel de lógica de la app.

-- Habilitar RLS en todas las tablas
alter table groups enable row level security;
alter table habits enable row level security;
alter table users enable row level security;
alter table rounds enable row level security;
alter table completions enable row level security;

-- GROUPS: lectura y creación pública
create policy "groups_select" on groups for select using (true);
create policy "groups_insert" on groups for insert with check (true);

-- HABITS: lectura y creación pública
create policy "habits_select" on habits for select using (true);
create policy "habits_insert" on habits for insert with check (true);

-- USERS: lectura y creación pública
create policy "users_select" on users for select using (true);
create policy "users_insert" on users for insert with check (true);
create policy "users_delete" on users for delete using (true);

-- ROUNDS: lectura, creación y actualización pública
create policy "rounds_select" on rounds for select using (true);
create policy "rounds_insert" on rounds for insert with check (true);
create policy "rounds_update" on rounds for update using (true);

-- COMPLETIONS: lectura, creación y actualización pública
create policy "completions_select" on completions for select using (true);
create policy "completions_insert" on completions for insert with check (true);
create policy "completions_update" on completions for update using (true);
