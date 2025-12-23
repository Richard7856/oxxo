-- Script para crear perfiles de usuarios existentes que no tienen perfil
-- Ejecutar en Supabase SQL Editor

-- Ver usuarios sin perfil
SELECT 
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE up.id IS NULL;

-- Crear perfiles para usuarios sin perfil (con protección contra duplicados)
INSERT INTO public.user_profiles (id, email, role, display_name)
SELECT 
  u.id,
  u.email,
  'conductor' as role,
  split_part(u.email, '@', 1) as display_name
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING; -- Prevenir errores si el perfil ya existe

-- Verificar que todos los usuarios tienen perfil
SELECT 
    COUNT(*) as total_users,
    COUNT(up.id) as users_with_profiles,
    COUNT(*) - COUNT(up.id) as users_without_profiles
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id;

-- Ver todos los perfiles ordenados por fecha de creación
SELECT * FROM public.user_profiles ORDER BY created_at DESC;
