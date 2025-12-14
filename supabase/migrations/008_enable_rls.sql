-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_tickets ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE user_profiles IS 'RLS enabled: users can view own profile, admins view all';
COMMENT ON TABLE stores IS 'RLS enabled: all authenticated can read, admins can modify';
COMMENT ON TABLE reportes IS 'RLS enabled: conductores own, comerciales by zona, admins all';
COMMENT ON TABLE messages IS 'RLS enabled: based on reporte access';
COMMENT ON TABLE processed_tickets IS 'RLS enabled: comerciales by zona, admins all';
