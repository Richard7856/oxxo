-- Allow any authenticated user to create reportes
-- This makes the system more flexible if you want non-conductors to create reports

-- New policy: Authenticated users can create reportes (for themselves)
CREATE POLICY "Authenticated users can create reportes"
  ON public.reportes FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()
  );

-- New policy: Authenticated users can update their own reportes
CREATE POLICY "Authenticated users can update own reportes"
  ON public.reportes FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Note: Las políticas existentes de conductores y admins siguen funcionando
-- Esta es una política adicional más permisiva que permite a cualquier autenticado crear reportes

