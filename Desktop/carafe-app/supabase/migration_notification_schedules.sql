-- Notification schedules: managers define recurring push notifications
CREATE TABLE notification_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  url text NOT NULL DEFAULT '/dashboard',
  hour smallint NOT NULL CHECK (hour >= 0 AND hour <= 23),
  days_of_week integer[] NOT NULL DEFAULT '{1,2,3,4,5,6,0}',
  target_role text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers can manage schedules" ON notification_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM establishment_members
      WHERE establishment_id = notification_schedules.establishment_id
        AND profile_id = auth.uid()
        AND role IN ('owner', 'manager')
        AND is_active = true
    )
  );
