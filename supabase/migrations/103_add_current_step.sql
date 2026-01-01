-- Add current_step column to reportes table to track progress
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS current_step TEXT;

-- Comment
COMMENT ON COLUMN reportes.current_step IS 'Current step in the report flow (e.g., "4a", "incident_check", "6", etc.)';

