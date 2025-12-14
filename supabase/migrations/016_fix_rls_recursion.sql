-- Fix RLS Recursion and Store Permissions

-- 1. Helper Functions (SECURITY DEFINER to bypass RLS)
-- These functions run with privileges of the creator (postgres), avoiding infinite recursion

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'administrador'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conductor()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'conductor'
  );
$$;

-- 2. Update User Profiles Policies (using is_admin)

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;
CREATE POLICY "Admins can update profiles"
  ON public.user_profiles FOR UPDATE
  USING (is_admin());

-- 3. Update Stores Policies (Allow Conductors!)

DROP POLICY IF EXISTS "Authenticated users can view stores" ON public.stores;
CREATE POLICY "Authenticated users can view stores"
  ON public.stores FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can insert stores" ON public.stores;
CREATE POLICY "Admins and Conductors can insert stores"
  ON public.stores FOR INSERT
  WITH CHECK (is_admin() OR is_conductor());

DROP POLICY IF EXISTS "Admins can update stores" ON public.stores;
CREATE POLICY "Admins and Conductors can update stores"
  ON public.stores FOR UPDATE
  USING (is_admin() OR is_conductor());

DROP POLICY IF EXISTS "Admins can delete stores" ON public.stores;
CREATE POLICY "Admins can delete stores"
  ON public.stores FOR DELETE
  USING (is_admin());
