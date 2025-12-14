-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to stores table
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to user_profiles table
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to reportes table
CREATE TRIGGER update_reportes_updated_at
  BEFORE UPDATE ON reportes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to set submitted_at and timeout_at when status changes to submitted
CREATE OR REPLACE FUNCTION set_reporte_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set submitted_at and timeout_at when transitioning to submitted
  IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status != 'submitted') THEN
    NEW.submitted_at = NOW();
    NEW.timeout_at = NOW() + INTERVAL '20 minutes';
  END IF;
  
  -- Set resolved_at when transitioning to terminal states
  IF NEW.status IN ('completed', 'resolved_by_driver', 'timed_out', 'archived') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'resolved_by_driver', 'timed_out', 'archived')) THEN
    NEW.resolved_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply reporte timestamp trigger
CREATE TRIGGER auto_set_reporte_timestamps
  BEFORE UPDATE ON reportes
  FOR EACH ROW
  EXECUTE FUNCTION set_reporte_timestamps();

-- Comments
COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates updated_at timestamp on row modification';
COMMENT ON FUNCTION set_reporte_timestamps IS 'Manages state transition timestamps for reportes';
