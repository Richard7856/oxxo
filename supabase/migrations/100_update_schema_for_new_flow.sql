-- Update reporte_type enum
-- Note: We can't use ALTER TYPE ADD VALUE inside a transaction block easily if it's already used, 
-- but Supabase migrations usually run in transaction. 
-- However, since version 12 postgres supports adding values in transaction.
ALTER TYPE reporte_type ADD VALUE IF NOT EXISTS 'entrega';
ALTER TYPE reporte_type ADD VALUE IF NOT EXISTS 'tienda_cerrada';
ALTER TYPE reporte_type ADD VALUE IF NOT EXISTS 'bascula';

-- Add evidence column (JSONB) to reportes table
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '{}'::jsonb;

-- Add incident_details column (JSONB) to reportes table
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS incident_details JSONB;
