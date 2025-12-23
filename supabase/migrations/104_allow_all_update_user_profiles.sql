-- Allow any authenticated user to update user_profiles
-- This is for the admin users page that should be accessible to anyone
-- In production, you may want to restrict this further

DROP POLICY IF EXISTS "Authenticated users can update profiles for admin" ON public.user_profiles;

CREATE POLICY "Authenticated users can update profiles for admin"
  ON public.user_profiles FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

