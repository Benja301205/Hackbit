-- ============================================
-- Migración 005: Sistema de disputas/objeciones
-- ============================================

CREATE TABLE disputes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  completion_id uuid NOT NULL REFERENCES completions(id) ON DELETE CASCADE,
  disputed_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  objection_text text NOT NULL,
  defense_text text,
  resolution text CHECK (resolution IN ('accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_disputes_completion ON disputes(completion_id);
CREATE INDEX idx_disputes_pending ON disputes(completion_id) WHERE resolution IS NULL;

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_select" ON disputes FOR SELECT USING (true);
CREATE POLICY "disputes_insert" ON disputes FOR INSERT WITH CHECK (true);
CREATE POLICY "disputes_update" ON disputes FOR UPDATE USING (true);
