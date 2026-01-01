-- Allow conductores to upsert stores during validation
-- This is needed when validating a store code that doesn't exist yet

-- Conductores can insert stores (for validation flow)
CREATE POLICY "Conductores can insert stores"
  ON stores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'conductor'
    )
  );

-- Conductores can update stores (for validation flow)
CREATE POLICY "Conductores can update stores"
  ON stores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'conductor'
    )
  );

-- Comments
COMMENT ON POLICY "Conductores can insert stores" ON stores IS 'Allows conductors to create stores during validation';
COMMENT ON POLICY "Conductores can update stores" ON stores IS 'Allows conductors to update stores during validation';

