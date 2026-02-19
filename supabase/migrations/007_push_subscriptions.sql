-- Push notification subscriptions
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_select" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "push_insert" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "push_delete" ON push_subscriptions FOR DELETE USING (true);
