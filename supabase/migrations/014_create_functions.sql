-- Atomic reporte creation function
-- Creates a reporte with proper validation and state initialization

CREATE OR REPLACE FUNCTION create_reporte_atomic(
  p_user_id uuid,
  p_store_id uuid,
  p_tipo_reporte reporte_type,
  p_conductor_nombre text,
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
  
  -- Insert reporte
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
    status
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
    'draft'
  ) RETURNING id INTO v_reporte_id;
  
  RETURN v_reporte_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION create_reporte_atomic IS 'Atomically creates a reporte with store snapshot';
