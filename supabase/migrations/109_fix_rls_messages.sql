-- Fix: Messages SELECT policy was only checking that the reporte EXISTS,
-- not that the current user has permission to access it.
-- This allowed any authenticated user who knew a reporte_id to read all its messages.

DROP POLICY IF EXISTS "Users can view messages for accessible reportes" ON messages;

CREATE POLICY "Users can view messages for accessible reportes"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reportes r
      WHERE r.id = messages.reporte_id
        AND (
          r.user_id = auth.uid()  -- Conductor dueño del reporte
          OR EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
              AND up.role IN ('comercial', 'administrador')
          )
        )
    )
  );

-- Fix INSERT policy as well - same issue, just existence check
DROP POLICY IF EXISTS "Users can send messages to accessible reportes" ON messages;

CREATE POLICY "Users can send messages to accessible reportes"
  ON messages FOR INSERT
  WITH CHECK (
    sender = 'user'
    AND sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM reportes r
      WHERE r.id = messages.reporte_id
        AND (
          r.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
              AND up.role IN ('comercial', 'administrador')
          )
        )
    )
  );

-- Allow comerciales and admins to also insert as 'agent' role
DROP POLICY IF EXISTS "Admins can insert system messages" ON messages;

CREATE POLICY "Agents and admins can insert system or agent messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender IN ('agent', 'system')
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('comercial', 'administrador')
    )
  );
