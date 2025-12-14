-- Reportes RLS Policies (Role-based access)

-- Conductores: Can view their own reportes
CREATE POLICY "Conductores can view own reportes"
  ON reportes FOR SELECT
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'conductor'
    )
  );

-- Conductores: Can create their own reportes
CREATE POLICY "Conductores can create own reportes"
  ON reportes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'conductor'
    )
  );

-- Conductores: Can update their own reportes
CREATE POLICY "Conductores can update own reportes"
  ON reportes FOR UPDATE
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'conductor'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Comerciales: Can view reportes in their assigned zona
CREATE POLICY "Comerciales can view zona reportes"
  ON reportes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'comercial'
        AND zona = reportes.store_zona
    )
  );

-- Comerciales: Can update reportes in their zona (for status changes)
CREATE POLICY "Comerciales can update zona reportes"
  ON reportes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'comercial'
        AND zona = reportes.store_zona
    )
  );

-- Administradores: Full access to all reportes
CREATE POLICY "Admins can view all reportes"
  ON reportes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

CREATE POLICY "Admins can create reportes"
  ON reportes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

CREATE POLICY "Admins can update all reportes"
  ON reportes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

CREATE POLICY "Admins can delete reportes"
  ON reportes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );
