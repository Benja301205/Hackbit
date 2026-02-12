-- ============================================
-- Migración 006: Agregar 'disputed' al CHECK de completions.status
-- ============================================
-- El CHECK original solo permitía 'pending', 'approved', 'rejected'
-- pero el sistema de disputas necesita el estado 'disputed'.

ALTER TABLE completions DROP CONSTRAINT completions_status_check;
ALTER TABLE completions ADD CONSTRAINT completions_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'disputed'));
