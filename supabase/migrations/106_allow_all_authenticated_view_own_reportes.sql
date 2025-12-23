-- Allow any authenticated user to view their own reportes
-- This complements the create policy to allow non-conductors to create and view their own reports

-- New policy: Authenticated users can view their own reportes
CREATE POLICY "Authenticated users can view own reportes"
  ON public.reportes FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()
  );

-- Note: Las políticas existentes siguen funcionando:
-- - Conductores siguen viendo sus reportes
-- - Comerciales siguen viendo reportes de su zona
-- - Admins siguen viendo todos
-- Esta es una política adicional más permisiva

