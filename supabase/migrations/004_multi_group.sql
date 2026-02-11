-- ============================================
-- Migración 004: Multi-grupo + bucket público
-- ============================================

-- Bug 2: Hacer bucket público para que getPublicUrl() funcione
UPDATE storage.buckets SET public = true WHERE id = 'habit-photos';

-- Bug 1: Eliminar constraint UNIQUE de session_token para permitir múltiples grupos
ALTER TABLE users DROP CONSTRAINT users_session_token_key;

-- Mejora 2/3: Agregar campo created_by a groups
ALTER TABLE groups ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;

-- Políticas RLS adicionales para groups
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (true);
CREATE POLICY "groups_delete" ON groups FOR DELETE USING (true);

-- Política RLS de DELETE para completions
CREATE POLICY "completions_delete" ON completions FOR DELETE USING (true);
