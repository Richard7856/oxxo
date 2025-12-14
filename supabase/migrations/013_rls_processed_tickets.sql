-- Processed Tickets RLS Policies

-- Comerciales can view processed tickets from their zona
CREATE POLICY "Comerciales can view zona processed tickets"
  ON processed_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN reportes r ON processed_tickets.reporte_id = r.id
      WHERE up.id = auth.uid() 
        AND up.role = 'comercial'
        AND up.zona = r.store_zona
    )
  );

-- Administradores: Full access
CREATE POLICY "Admins can view all processed tickets"
  ON processed_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

CREATE POLICY "Admins can insert processed tickets"
  ON processed_tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

CREATE POLICY "Admins can update processed tickets"
  ON processed_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

CREATE POLICY "Admins can delete processed tickets"
  ON processed_tickets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );
