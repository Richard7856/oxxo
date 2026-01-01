-- Script para crear perfiles de usuarios existentes que no tienen perfil
-- Ejecutar en Supabase SQL Editor

-- Ver usuarios sin perfil
SELECT 
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE up.id IS NULL;

-- Crear perfiles para usuarios sin perfil
INSERT INTO user_profiles (id, email, role, display_name)
SELECT 
  u.id,
  u.email,
  'conductor' as role,
  split_part(u.email, '@', 1) as display_name
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE up.id IS NULL;

-- Verificar que se crearon
SELECT * FROM user_profiles ORDER BY created_at DESC;
