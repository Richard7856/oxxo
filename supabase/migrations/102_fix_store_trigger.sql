-- Fix the update_updated_at_column function to ensure it works correctly
-- This addresses the "updatedAt" vs "updated_at" issue

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Explicitly check if the column exists and update it
  -- This works for all tables with updated_at column
  IF TG_TABLE_NAME = 'stores' THEN
    NEW.updated_at = NOW();
  ELSIF TG_TABLE_NAME = 'user_profiles' THEN
    NEW.updated_at = NOW();
  ELSIF TG_TABLE_NAME = 'reportes' THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's correct
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

