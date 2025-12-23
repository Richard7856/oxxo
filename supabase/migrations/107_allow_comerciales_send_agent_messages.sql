-- Allow comerciales to send agent messages
CREATE POLICY "Comerciales can send agent messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender = 'agent' AND
    sender_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'comercial'
    ) AND
    EXISTS (
      SELECT 1 FROM reportes
      WHERE reportes.id = messages.reporte_id
    )
  );

