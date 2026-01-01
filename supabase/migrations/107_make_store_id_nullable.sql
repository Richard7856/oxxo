-- Make store_id nullable since we're not using it anymore
-- We store store data directly in the reporte (denormalized)
ALTER TABLE reportes ALTER COLUMN store_id DROP NOT NULL;

-- Comment
COMMENT ON COLUMN reportes.store_id IS 'Deprecated: Store data is stored denormalized in store_codigo, store_nombre, store_zona. This field is kept for backward compatibility but can be NULL.';

