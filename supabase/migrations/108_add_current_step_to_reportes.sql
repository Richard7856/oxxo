-- Agregar campo current_step a la tabla reportes
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS current_step TEXT;

-- Comentario
COMMENT ON COLUMN reportes.current_step IS 'Paso actual en el flujo del reporte (ej: 4a, 6, incident_check, chat, finish, etc)';

-- Eliminar todas las versiones existentes de la función para evitar ambigüedad
DROP FUNCTION IF EXISTS create_reporte_atomic(uuid, uuid, reporte_type, text, text, jsonb, text);
DROP FUNCTION IF EXISTS create_reporte_atomic(uuid, uuid, text, reporte_type, text, jsonb, text);
DROP FUNCTION IF EXISTS create_reporte_atomic(uuid, uuid, reporte_type, text);
DROP FUNCTION IF EXISTS create_reporte_atomic(uuid, uuid, text, reporte_type);

-- Crear una sola versión con el orden correcto de parámetros
-- p_conductor_nombre es requerido, p_tipo_reporte es opcional (puede ser NULL)
CREATE OR REPLACE FUNCTION create_reporte_atomic(
  p_user_id uuid,
  p_store_id uuid,
  p_conductor_nombre text,
  p_tipo_reporte reporte_type DEFAULT NULL,
  p_motivo text DEFAULT NULL,
  p_ticket_data jsonb DEFAULT NULL,
  p_ticket_image_url text DEFAULT NULL
) RETURNS uuid 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reporte_id uuid;
  v_store_zona text;
  v_store_nombre text;
  v_store_codigo text;
  v_user_role user_role;
BEGIN
  -- Verify user exists and get role
  SELECT role INTO v_user_role
  FROM user_profiles WHERE id = p_user_id;
  
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Get store details
  SELECT zona, nombre, codigo_tienda 
  INTO v_store_zona, v_store_nombre, v_store_codigo
  FROM stores WHERE id = p_store_id;
  
  IF v_store_zona IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;
  
  -- Insert reporte with initial current_step = NULL (will be set when selecting type)
  INSERT INTO reportes (
    user_id, 
    store_id, 
    store_zona, 
    store_nombre, 
    store_codigo,
    tipo_reporte, 
    conductor_nombre,
    motivo,
    ticket_data, 
    ticket_image_url,
    status,
    current_step
  ) VALUES (
    p_user_id, 
    p_store_id, 
    v_store_zona, 
    v_store_nombre, 
    v_store_codigo,
    p_tipo_reporte, 
    p_conductor_nombre,
    p_motivo,
    p_ticket_data, 
    p_ticket_image_url,
    'draft',
    NULL
  ) RETURNING id INTO v_reporte_id;
  
  RETURN v_reporte_id;
END;
$$ LANGUAGE plpgsql;

