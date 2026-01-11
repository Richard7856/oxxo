-- Actualizar políticas RLS para que comerciales vean todos los reportes (no solo de su zona)
-- Ya que ahora solo se usa CDMX como zona única

-- Eliminar políticas antiguas que filtran por zona
DROP POLICY IF EXISTS "Comerciales can view zona reportes" ON reportes;
DROP POLICY IF EXISTS "Comerciales can update zona reportes" ON reportes;
DROP POLICY IF EXISTS "Comerciales can view zona processed tickets" ON processed_tickets;

-- Crear nuevas políticas sin filtro de zona
CREATE POLICY "Comerciales can view all reportes"
  ON reportes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'comercial'
    )
  );

CREATE POLICY "Comerciales can update all reportes"
  ON reportes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'comercial'
    )
  );

CREATE POLICY "Comerciales can view all processed tickets"
  ON processed_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
        AND role = 'comercial'
    )
  );


