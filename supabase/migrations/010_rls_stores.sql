-- Stores RLS Policies

-- All authenticated users can view stores
CREATE POLICY "Authenticated users can view stores"
  ON stores FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins can insert stores
CREATE POLICY "Admins can insert stores"
  ON stores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

-- Admins can update stores
CREATE POLICY "Admins can update stores"
  ON stores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

-- Admins can delete stores
CREATE POLICY "Admins can delete stores"
  ON stores FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );
