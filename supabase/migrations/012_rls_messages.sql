-- Messages RLS Policies (Access based on reporte access)

-- Users can view messages for reportes they can access
CREATE POLICY "Users can view messages for accessible reportes"
  ON messages FOR SELECT
  USING (
    -- Can view if can view the parent reporte
    -- This leverages existing reporte RLS policies
    EXISTS (
      SELECT 1 FROM reportes
      WHERE reportes.id = messages.reporte_id
    )
  );

-- Users can send messages to reportes they can access
CREATE POLICY "Users can send messages to accessible reportes"
  ON messages FOR INSERT
  WITH CHECK (
    sender = 'user' AND
    sender_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM reportes
      WHERE reportes.id = messages.reporte_id
    )
  );

-- Admins can insert system/agent messages
CREATE POLICY "Admins can insert system messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender IN ('agent', 'system') AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

-- Admins can delete messages
CREATE POLICY "Admins can delete messages"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );
